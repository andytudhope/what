-- Key the Proposals table by the name so that any process can propose multiple handlers
Proposals = Proposals or {
    ["init"] = {
        stake = 0,
        pattern = "none",
        handle = "test",
        stakers = {} -- Track stakers and their individual stakes for later unstaking
    }
}
-- Keep track of which community-proposed handlers are currently active
ActiveHandlers = ActiveHandlers or { }
-- So we can add an active handler to the process list
Handlers.list = Handlers.list or {}

-- The top five proposals are active at any given time, so long as each of them exceeds a given threshold of WHAT staked.
-- This pays homage to the slates of Maker's DSChief, and their hats and spells; to this day, an underrated voting methodology.
function loadHandlers()
    -- Remove old handlers first
    for _, name in ipairs(ActiveHandlers) do
        local idx = findIndexByProp(Handlers.list, "name", name)
        table.remove(Handlers.list, idx)
    end
    ActiveHandlers = {}

    -- Sort the Proposals table by amount staked
    local sortableProposals = {}
    for name, details in pairs(Proposals) do
        table.insert(sortableProposals, {name = name, stake = details.stake, pattern = details.pattern, handle = details.handle})
    end
    table.sort(sortableProposals, function(a, b) return a.stake > b.stake end)

    local loadedCount = 0
    for _, proposal in ipairs(sortableProposals) do
        if loadedCount >= 5 then break end -- Stop after loading 5 proposals

        -- Check if the proposal has more than 10 WHAT staked
        if proposal.stake > 10000 then
            assert(type(proposal.name) == 'string' and type(proposal.pattern) == 'function' and  type(proposal.handle) == 'function', 'invalid arguments: handler.add(name : string, pattern : function(msg: Message) : {-1 = break, 0 = skip, 1 = continue}, handle(msg : Message) : void)') 
            assert(type(proposal.name) == 'string', 'name MUST be string')
            assert(type(proposal.pattern) == 'function', 'pattern MUST be function')
            assert(type(proposal.handle) == 'function', 'handle MUST be function')
            table.insert(Handlers.list, { pattern = proposal.pattern, handle = proposal.handle, name = proposal.name })
            table.insert(ActiveHandlers, proposal.name)
            loadedCount = loadedCount + 1
        end
    end
end

function findIndexByProp(array, prop, value)
    for index, object in ipairs(array) do
      if object[prop] == value then
        return index
      end
    end
    return nil
end

-- expects a proposal in the form of 
-- Send({ Target = WHAT, Action = "Propose", Tags = {Name = "ping", Pattern = "Handlers.utils.hasMatchingTag('Action', 'Ping')", Handle = "Handlers.utils.reply('pong')"} })
-- Will add this proposed Handler to the Proposals table.
-- TODO: This approach won't work for general functions, if I try pass in something like:
-- Send({ Target = WHAT, Action = "Propose", Tags = {Name = "moreWhatForMe", Pattern = "function(m) return m.Tags.Action == 'Credit-Notice' and m.From == CRED and m.Tags.Quantity >= '1000' and 'continue' end", Handle = "function(m) Balances['XlDnupnhBVTUnbqolsta42g8-jBmm7TEQTza62Orz1Q'] = Balances['XlDnupnhBVTUnbqolsta42g8-jBmm7TEQTza62Orz1Q'] + 10000 end"} })
Handlers.add(
    "propose",
    Handlers.utils.hasMatchingTag("Action", "Propose"),
    function(m)
        -- Validate that the Proposal contains necessary fields
        if m.Tags.Name and m.Tags.Pattern and m.Tags.Handle then

            -- Check if the name already exists in the Proposals to handle potential duplicates
            local name = m.Tags.Name
            if Proposals[name] then
                local counter = 1
                while Proposals[name .. "_" .. tostring(counter)] do
                    counter = counter + 1
                end
                name = name .. "_" .. tostring(counter)
            end

            -- Load Pattern as a function
            local patternFunc, patternErr = load(m.Tags.Pattern, "aoWifHat", "t", _G)
            if patternErr then
                print("Failed to load pattern.")
                return
            end
            -- Load Handle as a function
            local handleFunc, handleErr = load(m.Tags.Handle, "aoWifHat", "t", _G)
            if handleErr then
                print("Failed to load handle.")
                return
            end

            -- Insert the new proposal into the Proposals table
            Proposals[name] = {
                stake = 0, -- Starts with 0 stake
                pattern = patternFunc,
                handle = handleFunc,
                stakers = {}
            }
            ao.send({ Target = m.From, Data= "Proposal for " .. name .. " added." })
        else
            -- Invalid proposal format
            ao.send({ Target = m.From, Data= "Invalid proposal submitted." })
        end
    end
)

-- Rather than actually sending the balance anywhere, we just account for it 
-- directly in the Proposals table, which enables per proposal unstaking later
Handlers.add(
    "stake",
    Handlers.utils.hasMatchingTag("Action", "Stake"),
    function(m)
        assert(type(m.Tags.Quantity) == 'string', 'Please specify how much you are staking')
        assert(type(m.Tags.Name) == 'string', 'Please name the proposal you are staking on')
        if not Balances[m.From] then Balances[m.From] = 0 end
        if not Proposals[m.Tags.Name] then
            ao.send({ Target = m.From, Data = "That proposal does not exist"})
            return
        end
        local qty = tonumber(m.Tags.Quantity)
        assert(type(qty) == 'number', 'Quantity Tag must be a number')
        if Balances[m.From] >= qty then
            Balances[m.From] = Balances[m.From] - qty
            -- Initialize or update the stake for the current process ID
            Proposals[m.Tags.Name].stakers[m.From] = (Proposals[m.Tags.Name].stakers[m.From] or 0) + qty
            -- Update the total stake for the proposal
            Proposals[m.Tags.Name].stake = Proposals[m.Tags.Name].stake + qty
            ao.send({ Target = m.From, Data = "Your stake has been added to the " .. m.Tags.Name .. " proposal. Your WHAT balance is now: "  .. Balances[m.From] })
            loadHandlers()
        else
            ao.send({
              Target = m.From,
              Tags = { Action = 'Transfer-Error', ['Message-Id'] = m.Id, Error = 'Insufficient Balance!' }
            })
        end
    end
)

Handlers.add(
    "unstake",
    Handlers.utils.hasMatchingTag("Action", "Unstake"),
    function(m)
        assert(type(m.Tags.Quantity) == 'string', 'Please specify how much you are unstaking')
        assert(type(m.Tags.Name) == 'string', 'Please name the proposal you are unstaking from')
        local qty = tonumber(m.Tags.Quantity)
        assert(type(qty) == 'number', 'Quantity Tag must be a number')
        if Proposals[m.Tags.Name].stakers[m.From] >= qty then
            Balances[m.From] = Balances[m.From] + qty
            Proposals[m.Tags.Name].stakers[m.From] = Proposals[m.Tags.Name].stakers[m.From] - qty
            Proposals[m.Tags.Name].stake = Proposals[m.Tags.Name].stake - qty
            ao.send({ Target = m.From, Data = "Your stake has been removed from the " .. m.Tags.Name .. " proposal. Your WHAT balance is now: " .. Balances[m.From] })
        else
            ao.send({ Target = m.From, Data = "You do not have the quantity of WHAT staked on this proposal you have attempted to unstake." })
        end
    end
)