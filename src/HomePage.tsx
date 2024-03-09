import { useEffect, useState } from 'react';
import { message, createDataItemSigner, result } from "@permaweb/aoconnect";
import { PermissionType } from 'arconnect'

const permissions: PermissionType[] = [
  'ACCESS_ADDRESS',
  'SIGNATURE',
  'SIGN_TRANSACTION',
  'DISPATCH'
]

interface Tag {
    name: string;
    value: string;
}

interface StakerDetails {
    [key: string]: number; 
}

interface ProposalDetail {
stake: number;
pattern: string; 
handle: string;
stakers: StakerDetails;
}

interface Proposal {
    name: string;
    stake: number;
    pattern: string;
    handle: string;
    stakers: StakerDetails;
}

const WHAT = "FsaSWViV6bicOat1teC1QnbX3rQfnWJuLah8ROFQ00w"
const CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc"

function HomePage () {
    const [address, setAddress] = useState('')
    const [whatBalance, setWhatBalance] = useState(0)
    const [credBalance, setCredBalance] = useState(0)
    const [credValue, setCredValue] = useState('')
    const [stakeValue, setStakeValue] = useState('')
    const [stakeName, setStakeName] = useState('')
    const [propName, setPropName] = useState('')
    const [propPattern, setPropPattern] = useState('')
    const [propHandle, setPropHandle] = useState('')
    const [swapSuccess, setSuccess] = useState(false)
    const [stakeSuccess, setStakeSuccess] = useState(false)
    const [proposals, setProposals] = useState<Proposal[]>([])
    
    const fetchAddress =  async () => {
        await window.arweaveWallet.connect(
            permissions,
            {
                name: "WHAT",
                logo: "OVJ2EyD3dKFctzANd0KX_PCgg8IQvk0zYqkWIj-aeaU"
            }
        )
        try {
            const address = await window.arweaveWallet.getActiveAddress()
            setAddress(address)
        } catch(error) {
            console.error(error)
        }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        switch (name) {
            case "stakeName":
                setStakeName(value);
                break;
            case "stakeValue":
                setStakeValue(value);
                break;
            case "swap":
                setCredValue(value);
                break;
            case "propName":
                setPropName(value);
                break
            default:
                break;
        }
    };

    const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        switch (name) {
            case "propPattern":
                setPropPattern(value)
                break
            case "propHandle":
                setPropHandle(value)
                break
            default:
                break
        }
    }

    const swap = async () => {
        var value = parseInt(credValue)
        var units = value * 1000
        var credUnits = units.toString()
        try {
            const getSwapMessage = await message({
                process: CRED,
                tags: [
                    { name: 'Action', value: 'Transfer' },
                    { name: 'Recipient', value: WHAT },
                    { name: 'Quantity', value: credUnits }
                ],
                signer: createDataItemSigner(window.arweaveWallet),
            });
            try {
                let { Messages, Error } = await result({
                    message: getSwapMessage,
                    process: CRED,
                });
                if (Error) {
                    alert("Error handling swap:" + Error);
                    return;
                }
                if (!Messages || Messages.length === 0) {
                    alert("No messages were returned from ao. Please try later.");
                    return; 
                }
                const actionTag = Messages[0].Tags.find((tag: Tag) => tag.name === 'Action')
                if (actionTag.value === "Debit-Notice") {
                    setSuccess(true)
                }
            } catch (error) {
                alert("There was an error when swapping CRED for WHAT: " + error)
            }
        } catch (error) {
            alert('There was an error swapping: ' + error)
        }
    }

    const stake = async () => {
        var value = parseInt(stakeValue)
        var units = value * 1000
        var whatUnits = units.toString()
        try {
            const getStakeMessage = await message({
                process: WHAT,
                tags: [
                    { name: 'Action', value: 'Stake' },
                    { name: 'Quantity', value: whatUnits },
                    { name: 'Name', value: stakeName },
                ],
                signer: createDataItemSigner(window.arweaveWallet),
            });
            try {
                let { Messages, Error } = await result({
                    message: getStakeMessage,
                    process: WHAT,
                });
                if (Error) {
                    alert("Error handling staking:" + Error);
                    return;
                }
                if (!Messages || Messages.length === 0) {
                    alert("No messages were returned from ao. Please try later.");
                    return; 
                }
                alert(Messages[0].Data)
                setStakeSuccess(true)
            } catch (error) {
                alert("There was an error when staking WHAT: " + error)
            }
        } catch (error) {
            alert('There was an error staking: ' + error)
        }
    }

    const propose = async () => {
        try {
            const getPropMessage = await message({
                process: WHAT,
                tags: [
                    { name: 'Action', value: 'Propose' },
                    { name: 'Name', value: propName },
                    { name: 'Pattern', value: propPattern },
                    { name: 'Handle', value: propHandle}
                ],
                signer: createDataItemSigner(window.arweaveWallet),
            });
            try {
                let { Messages, Error } = await result({
                    message: getPropMessage,
                    process: WHAT,
                });
                if (Error) {
                    alert("Error handling staking:" + Error);
                    return;
                }
                if (!Messages || Messages.length === 0) {
                    alert("No messages were returned from ao. Please try later.");
                    return; 
                }
                alert(Messages[0].Data)
                setPropName('')
                setPropPattern('')
                setPropHandle('')
            } catch (error) {
                alert("There was an error when staking WHAT: " + error)
            }
        } catch (error) {
            alert('There was an error staking: ' + error)
        }
    }

    useEffect(() => {
        const fetchBalance = async (process: string) => {
            try {
                const messageResponse = await message({
                    process,
                    tags: [
                        { name: 'Action', value: 'Balance' },
                    ],
                    signer: createDataItemSigner(window.arweaveWallet),
                });
                const getBalanceMessage = messageResponse;
                try {
                    let { Messages, Error } = await result({
                        message: getBalanceMessage,
                        process,
                    });
                    if (Error) {
                        alert("Error fetching balances:" + Error);
                        return;
                    }
                    if (!Messages || Messages.length === 0) {
                        alert("No messages were returned from ao. Please try later.");
                        return;
                    }
                    const balanceTag = Messages[0].Tags.find((tag: Tag) => tag.name === 'Balance')
                    const balance = balanceTag ? parseFloat((balanceTag.value / 1000).toFixed(4)) : 0;
                    if (process === WHAT) {
                        setWhatBalance(balance)
                    }
                    if (process === CRED) {
                        setCredBalance(balance)
                    }
                } catch (error) {
                    alert("There was an error when loading balances: " + error)
                }
            } catch (error) {
                console.error(error);
            }
        };
        fetchBalance(WHAT)
        fetchBalance(CRED)
    }, [address, swapSuccess, stakeSuccess])

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const messageResponse = await message({
                    process: WHAT,
                    tags: [
                        { name: 'Action', value: 'Proposals' },
                    ],
                    signer: createDataItemSigner(window.arweaveWallet),
                });
                const getProposalsMessage = messageResponse;
                try {
                    let { Messages, Error } = await result({
                        message: getProposalsMessage,
                        process: WHAT,
                    });
                    if (Error) {
                        alert("Error fetching proposals:" + Error);
                        return;
                    }
                    if (!Messages || Messages.length === 0) {
                        alert("No messages were returned from ao. Please try later.");
                        return;
                    }
                    const data = JSON.parse(Messages[0].Data)
                    const proposalsData = Object.entries(data).map(([name, details]) => {
                        const typedDetails: ProposalDetail = details as ProposalDetail;
                        return {
                          name,
                          stake: typedDetails.stake / 1000,
                          pattern: typedDetails.pattern,
                          handle: typedDetails.handle,
                          stakers: typedDetails.stakers,
                        };
                      });
                      setProposals(proposalsData);
                } catch (error) {
                    alert("There was an error when loading balances: " + error)
                }
            } catch (error) {
                console.error(error);
            }
        }
        fetchProposals()
    }, [])

	return (
		<div>
            {/* NAV BAR  */}
            <nav className="flex justify-between items-center p-4 border-b border-gray-200 shadow-sm">
                <img alt="logo" src="logo.png" width={"60px"} />
                {address ?
                    (
                        <p>
                            <span className="md:hidden">{`${address.slice(0, 5)}...${address.slice(-3)}`}</span>
                            <span className ="hidden sm:hidden md:block">{address}</span>
                        </p>
                    ) :
                    (
                        <button onClick={fetchAddress} className="bg-black hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                            Connect
                        </button>
                    )
                }
            </nav>

            {/* ABOVE FOLD - SWAP AND GENERAL INFO  */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-20">
                <div>
                    <img className="w-3/4 mx-auto" src="what.webp" alt="what!?" />
                </div>
                <div className="px-10">
                    <div className='grid grid-cols-2 gap-2 my-8'>
                        <div className='border-r border-black'>
                            <p className='text-lg md:text-center'>
                                CRED: <span className='font-bold'>{credBalance}</span>
                            </p>
                        </div>
                        <div>
                            <p className='text-lg md:text-center'>
                                WHAT: <span className='font-bold'>{whatBalance}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                    <input
                        type="text"
                        name="swap"
                        placeholder="Enter value"
                        value={credValue}
                        onChange={handleInputChange}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        className="py-2 px-4 bg-black text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        onClick={swap}
                    >
                        Swap
                    </button>
                    </div>
                    <p className='text-center text-sm text-slate-600 mt-2 mb-10'>
                        This will swap CRED for WHAT.
                    </p>
                    <hr />
                    <p className='text-lg my-4'>
                        WHAT is a token on the <a href="https://ao.arweave.dev/#/spec" target="_blank" rel="noopener noreferrer" className='font-bold underline'><code>ao</code> testnet</a>, which illustrates the simple power of a unified computing environment.
                    </p>
                    <p className='text-lg my-4'>
                        CRED is the token used to reward <a href="https://cookbook_ao.g8way.io/tutorials/begin/index.html" target="_blank" rel="noopener noreferrer" className='font-bold underline'>early contributors who fulfill the quests</a> on <code>ao</code>. You can get WHAT by exchanging your CRED for it on this page.
                    </p>
                    <p className='text-lg my-4'>
                        You will get <span className='font-bold'>1 WHAT for the 1st CRED</span> you send.It then decays linearly, until you get <span className='font-bold'>0 WHAT for the 10,000th CRED</span> you send. 
                    </p>
                    <p className='text-lg my-4'>
                        This is to incentivise a diverse set of early contributors and keep power well distributed, rather than granting too much power to early contributors who earn the most CRED.
                    </p>
                    <p className='text-lg my-4'>
                        WHAT holders use WHAT to vote on new code (called "Handlers") to be added to the WHAT process. The 5 proposed handlers with the most WHAT staked on them at any given time become active.
                    </p>
                    <p className='my-8 text-center'>
                        <a className="bg-black hover:bg-gray-600 text-white font-bold p-4 rounded" href="https://github.com/andytudhope" target="_blank" rel="noopener noreferrer">Review the code</a>
                    </p>
                </div>
            </div>

            {/* BELOW FOLD - PROPOSALS  */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-20">
                <div className="lg:ml-20 px-10">
                    <p className='text-4xl font-bold underline'>
                        Proposals
                    </p>

                    <div className='relative rounded-xl overflow-auto'>
                        <div className='shadow-sm overflow-hidden my-8'>
                            <div className="table border-collapse table-auto w-full text-sm">
                                <div className="table-header-group">
                                    <div className="table-row">
                                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Name</div>
                                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Stake</div>
                                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Stakers</div>
                                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Handle</div>
                                    <div className="table-cell border-b font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left">Pattern</div>
                                    </div>
                                </div>
                                <div className="table-row-group bg-white dark:bg-slate-800">
                                    {proposals.map((proposal, index) => (
                                    <div key={index} className="table-row">
                                        <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">{proposal.name}</div>
                                        <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">{proposal.stake}</div>
                                        <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">
                                        {Object.entries(proposal.stakers).map(([key, value]) => (
                                            <span key={key}>{`${key.substring(0, 5)}: ${value / 1000}`}</span>
                                        ))}
                                        </div>
                                        <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">{proposal.handle}</div>
                                        <div className="table-cell border-b border-slate-100 p-4 pl-8 text-slate-500 dark:text-slate-400">{proposal.pattern}</div>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p className='text-4xl font-bold underline'>
                        Stake
                    </p>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0 items-center justify-center mt-8">
                        <input
                            type="text"
                            name="stakeName"
                            placeholder="Name of proposal"
                            value={stakeName}
                            onChange={handleInputChange}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                            type="text"
                            name="stakeValue"
                            placeholder="Value to stake"
                            value={stakeValue}
                            onChange={handleInputChange}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            className="py-2 px-4 bg-black text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            onClick={stake}
                        >
                            Stake
                        </button>
                    </div>
                    <p className='text-center text-sm text-slate-600 mt-2 mb-10'>
                        This will stake WHAT on your chosen proposal.
                    </p>
                </div>
                <div className="px-10">
                    <p className='text-4xl font-bold underline'>
                        Make Your Own Proposal
                    </p>
                    <div className="flex flex-col space-y-4 flex-row space-x-2 mt-8">
                        <input
                            type="text"
                            name="propName"
                            placeholder="Name of proposal"
                            value={propName}
                            onChange={handleInputChange}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                            name="propPattern"
                            placeholder="The pattern to match for your code to be executed"
                            value={propPattern}
                            onChange={handleTextAreaChange}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                            name="propHandle"
                            placeholder="The code to be executed once a pattern is recognised"
                            value={propHandle}
                            onChange={handleTextAreaChange}
                            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            className="py-2 px-4 bg-black text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            onClick={propose}
                        >
                            Propose
                        </button>
                    </div>
                </div>
            </div>
			
		</div>
	);
}

export default HomePage;
