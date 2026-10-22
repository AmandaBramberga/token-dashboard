// Smart Contract Addresses
const INSTRUCTOR_ADDRESS = "0x5f3046bD5aA3c6d4575AF09B8198d584f130708E";
const SLV13_ADDRESS = "0x238359082d2d898A5ECa3F85b1D69c9a471ECb90";
const MTK_ADDRESS = "0x2ed855874404938C3299d8Dc3627B5FE7244EFAA"; 

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

let provider;
let signer;
let userAddress;

const connectBtn = document.getElementById("connectBtn");
const accountAddress = document.getElementById("accountAddress");
const refreshBtn = document.getElementById("refreshBtn");
const addMtkBtn = document.getElementById("addMtkBtn");
const addSlvBtn = document.getElementById("addSlvBtn");
const sendBtn = document.getElementById("sendBtn");
const fillInstructorBtn = document.getElementById("fillInstructorBtn");
const transferForm = document.getElementById("transferForm");
const txStatus = document.getElementById("txStatus");

async function init() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    connectBtn.addEventListener("click", connectWallet);
    refreshBtn.addEventListener("click", fetchBalances);
    addMtkBtn.addEventListener("click", () => addTokenToMetaMask(MTK_ADDRESS, "MTK", 18));
    addSlvBtn.addEventListener("click", () => addTokenToMetaMask(SLV13_ADDRESS, "SLV13", 18));
    fillInstructorBtn.addEventListener("click", () => {
      document.getElementById("recipientInput").value = INSTRUCTOR_ADDRESS;
    });
    transferForm.addEventListener("submit", handleTransfer);
  } else {
    alert("MetaMask is not installed. Please install MetaMask to use this app.");
  }
}

async function connectWallet() {
  try {
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];
    signer = provider.getSigner();

    connectBtn.innerText = "Connected";
    connectBtn.disabled = true;
    accountAddress.innerText = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;

    enableButtons();
    await fetchBalances();
  } catch (err) {
    console.error(err);
    alert("Failed to connect wallet.");
  }
}

function enableButtons() {
  refreshBtn.disabled = false;
  addMtkBtn.disabled = false;
  addSlvBtn.disabled = false;
  sendBtn.disabled = false;
}

async function fetchBalances() {
  if (!userAddress) return;

  try {
    const ethBal = await provider.getBalance(userAddress);
    document.getElementById("ethBalance").innerText = parseFloat(ethers.utils.formatEther(ethBal)).toFixed(4);

    const slvContract = new ethers.Contract(SLV13_ADDRESS, ERC20_ABI, provider);
    const slvBal = await slvContract.balanceOf(userAddress);
    document.getElementById("slvBalance").innerText = parseFloat(ethers.utils.formatUnits(slvBal, 18)).toFixed(2);

    try {
      const mtkContract = new ethers.Contract(MTK_ADDRESS, ERC20_ABI, provider);
      const mtkBal = await mtkContract.balanceOf(userAddress);
      document.getElementById("mtkBalance").innerText = parseFloat(ethers.utils.formatUnits(mtkBal, 18)).toFixed(2);
    } catch (e) {
      document.getElementById("mtkBalance").innerText = "N/A";
    }
  } catch (err) {
    console.error("Error fetching balances:", err);
  }
}

async function addTokenToMetaMask(address, symbol, decimals) {
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: { address: address, symbol: symbol, decimals: decimals },
      },
    });
  } catch (error) {
    console.error(error);
  }
}

async function handleTransfer(e) {
  e.preventDefault();
  const token = document.getElementById("tokenSelect").value;
  const recipient = document.getElementById("recipientInput").value;
  const amount = document.getElementById("amountInput").value;

  const tokenAddress = token === "SLV13" ? SLV13_ADDRESS : MTK_ADDRESS;

  txStatus.innerText = "Initiating transaction...";
  txStatus.style.color = "#38bdf8";

  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const parsedAmount = ethers.utils.parseUnits(amount, 18);

    const tx = await contract.transfer(recipient, parsedAmount);
    txStatus.innerText = `Transaction sent! Hash: ${tx.hash}`;

    await tx.wait();
    txStatus.innerText = "Transaction confirmed successfully!";
    txStatus.style.color = "#4ade80";

    fetchBalances();
  } catch (err) {
    console.error(err);
    txStatus.innerText = `Transfer failed: ${err.message || err}`;
    txStatus.style.color = "#f87171";
  }
}

window.addEventListener("DOMContentLoaded", init);
