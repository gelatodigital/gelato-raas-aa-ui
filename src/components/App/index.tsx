import { useEffect, useState } from "react";
import { Status, State, TaskState, Message } from "../../types/Status";
import { BiRefresh, BiCopy } from "react-icons/bi";
import { interval, Subject, takeUntil } from "rxjs";
import { Contract, Signer, ethers, providers, utils } from "ethers";
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import { Dropdown } from "react-dropdown-now";
import "react-dropdown-now/style.css";
import Header from "../Header";
import "./style.css";
import axios from "axios";
import Loading from "../Loading";
import Button from "../Button";
import { Link, Route, Routes,useLocation,useParams,useNavigate } from "react-router-dom"
import AccountAbstraction, {
  AccountAbstractionConfig,
} from "gelato-raas-account-abstraction-kit";


import { GelatoRelayPack } from "gelato-raas-relay-kit";
import { counterAbi } from "../../assets/contracts/counterAbi";

import "react-dropdown-now/style.css";
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
} from "@safe-global/safe-core-sdk-types";



import { RAAS_NETWORKS } from "../../networks";
import { GELATO_KEY } from "../../constants";
const App = () => {
  const navigate = useNavigate()

  let destroyFetchTask: Subject<void> = new Subject();
  let txHash: string | undefined;
  const query = useQuery()
  let networkSearch = query.get("network");

  if (networkSearch == null || RAAS_NETWORKS[networkSearch] == undefined ){
    networkSearch = 'reyaCronos'
  }

  let network = RAAS_NETWORKS[networkSearch!]

  const targetAddress = network.simpleCounter;
  const GELATO_RELAY_API_KEY = GELATO_KEY[networkSearch!]
  const rollups:string[] = ['reyaCronos','liskSepolia','zKatana','unreal','opTestnet']

  const [counterContract, setCounterContract] = useState<Contract>();
  const [ready, setReady] = useState(false);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<Message>({
    header: "Loading",
    body: undefined,
    taskId: undefined,
  });
  const [counter, setCounter] = useState<string>("Loading");
  const [safe, setSafe] = useState<string | undefined>();
  const [signerAddress, setSignerAddress] = useState<string | null>(null);

  const [connectStatus, setConnectStatus] = useState<Status | null>({
    state: State.missing,
    message: "Loading",
  });

const selectRollup = async (network:any)=> {
  console.log(network)
  navigate(`/?network=${network.value}`)
}

  const onDisconnect = async () => {
    setLoading(true);
    setConnectStatus({
      state: State.failed,
      message: "Waiting for Disconnection",
    });
    await web3auth?.logout();
    setLoading(false);
  };

  const onConnect = async () => {

    try {
      const web3auth = new Web3Auth({
        clientId:
          "BFolnrXUpJ8WScbI0MHGllgsP4Jgyy9tuAyfd4rLJ0d07b1iGMhZw3Eu2E10HECY2KIqYczag4_Z4q7KsEojUWU", // get it from Web3Auth Dashboard
        web3AuthNetwork: "sapphire_devnet",
        chainConfig: {
          chainNamespace: "eip155",
          chainId: ethers.utils.hexlify(network.config.id),
          rpcTarget: network.config.rpcUrls.default.http,
          // Avoid using public rpcTarget in production.
          // Use services like Infura, Quicknode etc
          displayName: network.config.name as string,
          blockExplorer: network.config.blockExplorers.default.url,
          ticker: "ETH",
          tickerName: "ETH",
        },
      });
      await web3auth!.initModal({
        modalConfig: {
          // Disable Wallet Connect V2
          [WALLET_ADAPTERS.WALLET_CONNECT_V2]: {
            label: "wallet_connect",
            showOnModal: false,
          },
          // Disable Metamask
          [WALLET_ADAPTERS.METAMASK]: {
            label: "metamask",
            showOnModal: false,
          },
           // Disable Metamask
           [WALLET_ADAPTERS.TORUS_EVM]: {
            label: "torus",
            showOnModal: false,
          },
        },
      });

   
      const web3authProvider = await web3auth!.connect();



      const provider = new ethers.providers.Web3Provider(web3authProvider!);
      setWeb3auth(web3auth);
      refresh(provider);
      const user = await web3auth!.getUserInfo();
      

      return;
    } catch (error) {}
  };

  const onCopy = async (text: string) => {
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
    } else {
      document.execCommand("copy", true, text);
    }
    alert("Copied to Clipboard");
  };

  const onAction = async (action: number) => {
    switch (action) {
      case 0:

        increment();

        break;

      default:
        setLoading(false);
        break;
    }
  };

  const increment= async () => {

    try {
      setMessage({
        header: "Waiting for tx...",
        body: undefined,
        taskId: undefined,
      });
      setLoading(true);
      let tmpCountercontract = await getCounterContract(provider!);

      const { data: dataCounter } =
        await tmpCountercontract!.populateTransaction.increment();
      const gasLimit = "10000000";
      const txConfig = {
        to: targetAddress,
        data: dataCounter!,
        value: "0",
        operation: 0,
        gasLimit,
      };

      const safeTransactions: MetaTransactionData[] = [
        {
          to: txConfig.to,
          data: txConfig.data,
          value: txConfig.value,
          operation: OperationType.Call,
        },
      ];
      const options: MetaTransactionOptions = {
        gasLimit: txConfig.gasLimit,
        isSponsored: true,
      };
      let web3AuthSigner  = signer;
      try {
        const privateKey = "0x" + await web3auth!.provider!.request({
          method: "eth_private_key"
        }) as string;
        web3AuthSigner  = new ethers.Wallet(privateKey!, provider!);
      } catch (error) {
        
      }
      const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY);



      const safeAccountAbstraction = new AccountAbstraction(web3AuthSigner !);
      const sdkConfig: AccountAbstractionConfig = {
        relayPack,
      };
      await safeAccountAbstraction.init(sdkConfig);

      setMessage({
        header: "Relaying tx",
        body: "Waiting....",
        taskId: undefined,
      });
      const response = await safeAccountAbstraction.relayTransaction(
        safeTransactions,
        options
      );

      console.log(`https://relay.gelato.digital/tasks/status/${response}`);
      fetchStatus(response);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const fetchStatus = async (taskIdToQuery: string) => {
    console.log(taskIdToQuery);

    const numbers = interval(1000);

    const takeFourNumbers = numbers.pipe(takeUntil(destroyFetchTask));

    takeFourNumbers.subscribe(async (x) => {
      try {
        // let status = await relay.getTaskStatus(taskIdToQuery);
        const res = await axios.get(
          `https://relay.gelato.digital/tasks/status/${taskIdToQuery}`
        );

        let status = res.data.task;

        let details = {
          txHash: status?.transactionHash || undefined,
          chainId: status?.chainId?.toString() || undefined,
          blockNumber: status?.blockNumber?.toString() || undefined,
          executionDate: status?.executionDate || undefined,
          creationnDate: status?.creationDate || undefined,
          taskState: (status?.taskState as TaskState) || undefined,
        };
        let body = ``;
        let header = ``;

        txHash = details.txHash;


        switch (details.taskState!) {
          case TaskState.WaitingForConfirmation:
            header = `Transaction Relayed`;
            body = `Waiting for Confirmation`;
            break;
          case TaskState.Pending:
            header = `Transaction Relayed`;
            body = `Pending Status`;

            break;
          case TaskState.CheckPending:
            header = `Transaction Relayed`;
            body = `Simulating Transaction`;

            break;
          case TaskState.ExecPending:
            header = `Transaction Relayed`;
            body = `Pending Execution`;
            break;
          case TaskState.ExecSuccess:
            header = `Transaction Executed`;
            body = `Waiting to refresh...`;

            destroyFetchTask.next();
            setTimeout(() => {
              doRefresh();
            }, 2000);

            break;
          case TaskState.Cancelled:
            header = `Canceled`;
            body = `TxHash: ${details.txHash}`;
            destroyFetchTask.next();
            break;
          case TaskState.ExecReverted:
            header = `Reverted`;
            body = `TxHash: ${details.txHash}`;
            destroyFetchTask.next();
            break;
          case TaskState.NotFound:
            header = `Not Found`;
            body = `TxHash: ${details.txHash}`;
            destroyFetchTask.next();
            break;
          case TaskState.Blacklisted:
            header = `BlackListed`;
            body = `TxHash: ${details.txHash}`;
            destroyFetchTask.next();
            break;
          default:
            // ExecSuccess = "ExecSuccess",
            // ExecReverted = "ExecReverted",
            // Blacklisted = "Blacklisted",
            // Cancelled = "Cancelled",
            // NotFound = "NotFound",
            // destroyFetchTask.next();
            break;
        }

        setMessage({
          header,
          body,
          taskId: txHash,
        });
      } catch (error) {
        console.log(error);
      }
    });
  };

  const doRefresh = async () => {
    setMessage({
      header: "Checking Safes....",
      body: undefined,
      taskId: undefined,
    });
    setLoading(true);
    await refresh(provider!);
  };

  const refresh = async (provider: providers.Web3Provider) => {
    setProvider(provider);

    const signer = await provider?.getSigner();
    const signerAddress = (await signer?.getAddress()) as string;
    setSignerAddress(signerAddress);
    setSigner(signer);
    setConnectStatus({
      state: State.success,
      message: "Connection Succeed",
    });

    getSafeAddress(provider, signer);

    //
    // console.log(signer);
  };

  const getCounterContract = async (provider: providers.Web3Provider) => {
    if (counterContract == undefined) {
      const signer = await provider?.getSigner();
      const counterAddress = targetAddress;
      const _counterContract = new Contract(counterAddress, counterAbi, signer);

      setCounterContract(counterContract);
      return _counterContract;
    } else {
      return counterContract;
    }
  };

  const getSafeAddress = async (provider: any, signer?: any) => {
    setMessage({
      header: "Calculating Address",
      body: "Waiting....",
      taskId: undefined,
    });
    setLoading(true);
    const relayPack = new GelatoRelayPack(GELATO_RELAY_API_KEY);
    const safeAccountAbstraction = new AccountAbstraction(signer!);
    const sdkConfig: AccountAbstractionConfig = {
      relayPack,
    };
    await safeAccountAbstraction.init(sdkConfig);

    const safeAddress = await safeAccountAbstraction.getSafeAddress();
    const isDeployed = await safeAccountAbstraction.isSafeDeployed();

 
    setSafe(safeAddress);
    await getCounter(provider);
    setLoading(false);
  };

  const getCounter = async (provider: providers.Web3Provider) => {
    const contract = await getCounterContract(provider);

    const balance = await contract.counter();

    setCounter(balance.toString());
  };
  function useQuery() {
    // Use the URLSearchParams API to extract the query parameters
    // useLocation().search will have the query parameters eg: ?foo=bar&a=b
    return new URLSearchParams(useLocation().search)
  }


  

  useEffect(() => {
    (async () => {
      if (provider != null) {
        return;
      }
      if (networkSearch == null || RAAS_NETWORKS[networkSearch] == undefined ){

        navigate('/?network=reyaCronos')
      }
    
      setConnectStatus({
        state: State.failed,
        message: "Waiting for Disconnection",
      });
    })();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <Header
          status={connectStatus}
          ready={ready}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          signerAddress={signerAddress}
        />
           <Routes>
       <Route path="/" element=
       {<div>
        {connectStatus?.state! == State.success && (
          <div>
            {loading && <Loading message={message} network={network} />}
            <main>
              <div className="flex">
                <p className="title">AA on {network.config.name}</p>
                {signerAddress != undefined ? (
                <div className="isDeployed">
                  <p>User:</p>
                  <p className="highlight">
                  <a
                        href={`${network.config.blockExplorers.default.url}/address/${signerAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {signerAddress.substring(0, 6) +
                          "..." +
                          signerAddress.substring(
                            signerAddress.length - 6,
                            signerAddress.length
                          )}
                    <span
                      style={{ position: "relative", top: "5px", left: "5px" }}
                    >
                      <BiCopy
                        cursor={"pointer"}
                        color="white"
                        fontSize={"20px"}
                        onClick={() => onCopy(signerAddress!)}
                      />
                    </span>
                    </a>
                  </p>

                  {safe != undefined ? (
                    <div style={{ width: "350px", margin: "25px auto 10px" }}>
                      <p style={{ fontWeight: "600" }}>Your Safe</p>
                      <p className="highlight">
                      <a
                            href={`${network.config.blockExplorers.default.url}/address/${safe}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {safe.substring(0, 6) +
                              "..." +
                              safe.substring(safe.length - 6, safe.length)}
                            <span
                              style={{
                                position: "relative",
                                top: "5px",
                                left: "5px",
                              }}
                            >
                              <BiCopy
                                cursor={"pointer"}
                                color="white"
                                fontSize={"20px"}
                                onClick={() => onCopy(safe!)}
                              />
                            </span>
                          </a>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: "600" }}>
                        No safes associated to this user
                      </p>
                      <Button ready={ready} onClick={() => onAction(1)}>
                        {" "}
                        Get Safe Address
                      </Button>
                    </div>
                  )}
                  {safe != undefined && (
                    <div>
                      <p style={{ fontWeight: "600" }}>
                        Counter:
                        <span
                          style={{ marginLeft: "10px", fontSize: "15px" }}
                          className="highlight"
                        >
                       
                       {counter}
                          <span style={{ position: "relative", top: "5px" }}>
                            <BiRefresh
                              color="white"
                              cursor={"pointer"}
                              fontSize={"20px"}
                              onClick={doRefresh}
                            />
                          </span>
                        </span>
                       
                      </p>
                      <p className="highlight">
                          <a
                            href={`${network.config.blockExplorers.default.url}/address/${network.simpleCounter}?tab=read_contract`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {network.simpleCounter.substring(0,6)+'....'+network.simpleCounter.substring(network.simpleCounter.length-6,network.simpleCounter.length)}
                            <span
                              style={{
                                position: "relative",
                                top: "5px",
                                left: "5px",
                              }}
                            >
                              <BiCopy
                                cursor={"pointer"}
                                color="white"
                                fontSize={"20px"}
                                onClick={() =>
                                  onCopy(
                                    network.simpleCounter
                                  )
                                }
                              />
                            </span>
                          </a>
                        </p>
                      <Button ready={ready} onClick={() => onAction(0)}>
                        {" "}
                       Increment
                      </Button>
                    </div>
                  )}
                </div>
                  ) : (
                    <div></div>
                  )}
              </div>
            </main>
          </div>
        )}{" "}
        {connectStatus?.state! == State.missing && (
          <p style={{ textAlign: "center" }}>Metamask not Found</p>
        )}
        {(connectStatus?.state == State.pending ||
          connectStatus?.state == State.failed) && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <div style={{width:'300px',margin:'0 auto 30px'}}>
            <h4 style={{margin:'5px auto 5px'}}> Choose Your Gelato RollUp</h4>
                <Dropdown
                              
                                  placeholder="Select an option"
                                  options={rollups}
                                  value={networkSearch}
                                  onSelect={(value: any) => selectRollup(value)}
                                
                                />
               </div>
            <h3 style={{margin:'5px auto 5px'}}> Please Sign In</h3>
            <Button status={connectStatus} ready={ready} onClick={onConnect}>
              <span style={{ position: "relative", top: "0px" }}>Sign In</span>
            </Button>
          </div>
        )}
       </div>}></Route>
       </Routes>
      </div>
    </div>
  );
};

export default App;
