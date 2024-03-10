local json = require('json')

CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

if not Balances then Balances = { [ao.id] = 0 } end
if not CredSent then CredSent = { [ao.id] = 0 } end

if Name ~= 'aoWifHat' then Name = 'aoWifHat' end

if Ticker ~= 'WHAT' then Ticker = 'WHAT' end

if Denomination ~= 1 then Denomination = 1 end

if not Logo then Logo = 'OVJ2EyD3dKFctzANd0KX_PCgg8IQvk0zYqkWIj-aeaU' end

-- This function may seem strange at first, but it's worth thinking about.
-- We want a community meme coin, which is used to vote on what appears in a iframe
-- on a "community" web property. Therefore, it its likely that we want to 
-- incentivise lots of small holders, with roughly equal amounts, such that we
-- have a greater chance of creating a vibrant ecosystem of regular stakers,
-- rather than a stale one which tends towards a few whales over time.
-- How do we achieve such a thing?
-- We mint 1WHAT:1CRED for the first CRED you send in, and then implement
-- a linear decay function such that you get 0 WHAT for the 10001st CRED you send.
-- This actively disincentivises people sending in lots of CRED in order to get
-- more power over what appears on the community website, and allows us to go 
-- along with the rather simple schemes in the voting + staking blueprints without
-- causing too many power imbalances (hopefully).
local function calcCoin(quantity, process)
  -- we know, due to validSend() below, that no-one can send
  -- more than 10000 as the quantity to this process
  local whatToMint

  if CredSent[process] == nil then
      CredSent[process] = quantity
      whatToMint = 0.0001 + (1 - (CredSent[process] / 10000)) * CredSent[process]
  else
    local whatAlreadyMinted = 0.0001 + (1 - (CredSent[process] / 10000)) * CredSent[process]
    CredSent[process] = CredSent[process] + quantity
    local totalWhat = 0.0001 + (1 - (CredSent[process] / 10000)) * CredSent[process]
    whatToMint = totalWhat - whatAlreadyMinted
  end

  local actualWhatUnits = whatToMint * 1000
  return actualWhatUnits
end

local function validSend(quantity, process)
  if CredSent[process] == nil or CredSent[process] + quantity <= 10000 then
    return true
  else
    return false
  end
end

-- Handler for incoming messages

Handlers.add('info', Handlers.utils.hasMatchingTag('Action', 'Info'), function(m)
    ao.send(
        { Target = m.From, Tags = { Name = Name, Ticker = Ticker, Logo = Logo, Denomination = tostring(Denomination) } })
    end)

-- Handlers for token balances and info

Handlers.add('balance', Handlers.utils.hasMatchingTag('Action', 'Balance'), function(m)
    local bal = '0'
    
    -- If not Target is provided, then return the Senders balance
    if (m.Tags.Target and Balances[m.Tags.Target]) then
        bal = tostring(Balances[m.Tags.Target])
    elseif Balances[m.From] then
        bal = tostring(Balances[m.From])
    end
    
    ao.send({
        Target = m.From,
        Tags = { Target = m.From, Balance = bal, Ticker = Ticker, Data = json.encode(tonumber(bal)) }
    })
    end)
    
Handlers.add('balances', Handlers.utils.hasMatchingTag('Action', 'Balances'),
    function(m) ao.send({ Target = m.From, Data = json.encode(Balances) }) end)

-- Handler for transfers

Handlers.add('transfer', Handlers.utils.hasMatchingTag('Action', 'Transfer'), function(m)
    assert(type(m.Tags.Recipient) == 'string', 'Recipient is required!')
    assert(type(m.Tags.Quantity) == 'string', 'Quantity is required!')

    if not Balances[m.From] then Balances[m.From] = 0 end

    if not Balances[m.Tags.Recipient] then Balances[m.Tags.Recipient] = 0 end
    local qty = tonumber(m.Tags.Quantity)
    assert(type(qty) == 'number', 'qty must be number')

    if Balances[m.From] >= qty then
      Balances[m.From] = Balances[m.From] - qty
      Balances[m.Tags.Recipient] = Balances[m.Tags.Recipient] + qty

      --[[
        Only Send the notifications to the Sender and Recipient
        if the Cast tag is not set on the Transfer message
      ]] --
      if not m.Tags.Cast then
        -- Send Debit-Notice to the Sender
        ao.send({
          Target = m.From,
          Tags = { Action = 'Debit-Notice', Recipient = m.Tags.Recipient, Quantity = tostring(qty) }
        })
        -- Send Credit-Notice to the Recipient
        ao.send({
          Target = m.Tags.Recipient,
          Tags = { Action = 'Credit-Notice', Sender = m.From, Quantity = tostring(qty) }
        })
      end
    else
      ao.send({
        Target = m.Tags.From,
        Tags = { Action = 'Transfer-Error', ['Message-Id'] = m.Id, Error = 'Insufficient Balance!' }
      })
    end
  end)

-- Handler for processes that want to buy WHAT
Handlers.add(
  "buy",
  function(m)
      return
          m.Tags.Action == "Credit-Notice" and
          m.From == CRED and
          m.Tags.Quantity >= "1000" and "continue" -- 1 CRED == 1000 CRED Units
  end,
  function(m)
      local qty = tonumber(m.Tags.Quantity)
      local act = qty / 1000
      if validSend(act, m.Tags.Sender) then
        local what = calcCoin(act, m.Tags.Sender)
        Balances[m.Tags.Sender] = (Balances[m.Tags.Sender] or 0) + what
        ao.send({ Target = m.Tags.Sender, Data = "Your WHAT balance is now: " .. Balances[m.Tags.Sender] })
      else
        ao.send({Target = m.Tags.Sender, Data = "You can't buy WHAT worth more than 10000 CRED"})
      end
  end
)