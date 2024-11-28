document.addEventListener("DOMContentLoaded", () => {
  const rewardsGrid = document.getElementById("rewardsGrid");
  const userPointsDisplay = document.getElementById("userPoints");
  const redeemModal = document.getElementById("redeemModal");
  const redeemItemName = document.getElementById("redeemItemName");
  const redeemItemPoints = document.getElementById("redeemItemPoints");
  const confirmRedeem = document.getElementById("confirmRedeem");
  const cancelRedeem = document.getElementById("cancelRedeem");
  const consumedRewardsContainer = document.getElementById("consumedRewards");

  let userPoints = 0;
  let rewards = [];
  let selectedReward = null;

  async function fetchUserPoints() {
    try {
      const response = await fetch("/user-prizes", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch user points");
      }
      const data = await response.json();
      userPoints = data.points;
      updateUserPoints();
    } catch (error) {
      console.error("Error fetching user points:", error);
      alert("Failed to fetch user points. Please try refreshing the page.");
    }
  }

  async function fetchRewards() {
    try {
      const response = await fetch("/system-prizes", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch rewards");
      }
      rewards = await response.json();
      populateRewards(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      alert("Failed to fetch rewards. Please try refreshing the page.");
    }
  }

  function updateUserPoints() {
    userPointsDisplay.textContent = userPoints;
  }

  function createRewardItem(reward) {
    const rewardItem = document.createElement("div");
    rewardItem.className = "reward-item";
    rewardItem.innerHTML = `
            <img src="${reward.imageUrl}" alt="${reward.name}">
            <h3>${reward.name}</h3>
            <p class="points">${reward.points} points</p>
            <button class="btn-primary redeem-btn" data-id="${reward.id}">Redeem</button>
        `;
    return rewardItem;
  }

  function populateRewards(rewards) {
    rewardsGrid.innerHTML = "";
    rewards.forEach((reward) => {
      const rewardItem = createRewardItem(reward);
      rewardsGrid.appendChild(rewardItem);
    });
  }

  function showRedeemModal(reward) {
    redeemItemName.textContent = reward.name;
    redeemItemPoints.textContent = reward.points;
    redeemModal.style.display = "block";
  }

  function hideRedeemModal() {
    redeemModal.style.display = "none";
  }

  async function redeemReward(reward) {
    try {
      const response = await fetch("/get-user-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardId: reward.id }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error redeeming reward");
      }

      const result = await response.json();
      userPoints = result.points;
      updateUserPoints();
      alert(`You have successfully redeemed ${reward.name}!`);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      alert(error.message || "An error occurred while redeeming the reward");
    }
  }

  rewardsGrid.addEventListener("click", (e) => {
    if (e.target.classList.contains("redeem-btn")) {
      const rewardId = parseInt(e.target.getAttribute("data-id"));
      selectedReward = rewards.find((reward) => reward.id === rewardId);
      if (selectedReward) {
        showRedeemModal(selectedReward);
      }
    }
  });

  confirmRedeem.addEventListener("click", async () => {
    if (selectedReward) {
      await redeemReward(selectedReward);
      hideRedeemModal();
      fetchRewards();
    }
  });

  cancelRedeem.addEventListener("click", hideRedeemModal);

  window.addEventListener("click", (e) => {
    if (e.target === redeemModal) {
      hideRedeemModal();
    }
  });

  async function fetchConsumedRewards() {
    try {
      const response = await fetch("/user-prize-history", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch consumed rewards");
      }
      const consumedRewards = await response.json();
      displayConsumedRewards(consumedRewards);
    } catch (error) {
      console.error("Error fetching consumed rewards:", error);
      alert(error.message);
    }
  }

  function displayConsumedRewards(consumedRewards) {
    consumedRewardsContainer.innerHTML = "";
    if (consumedRewards.length === 0) {
      consumedRewardsContainer.innerHTML = "<p>No rewards consumed yet.</p>";
      return;
    }

    consumedRewards.forEach((redemption) => {
      console.log({ redemption });
      const rewardItem = document.createElement("div");
      rewardItem.className = "consumed-reward-item";
      rewardItem.innerHTML = `
                <img src="${redemption.imageUrl}" alt="${redemption.name}">
                <h3>${redemption.name}</h3>
                <p>Redeemed on: ${new Date(
                  redemption.createdAt
                ).toLocaleDateString()}</p>
            `;
      consumedRewardsContainer.appendChild(rewardItem);
    });
  }

  // Initialize the page
  fetchUserPoints();
  fetchRewards();
  fetchConsumedRewards();
});
