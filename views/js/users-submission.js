document.addEventListener("DOMContentLoaded", async () => {
  const approvalItems = document.getElementById("approvalItems");
  const statusFilter = document.getElementById("statusFilter");
  const applyFiltersBtn = document.getElementById("applyFilters");
  const approvalModal = document.getElementById("approvalModal");
  const modalContent = document.getElementById("modalContent");
  const approveBtn = document.getElementById("approveBtn");
  const rejectBtn = document.getElementById("rejectBtn");
  const closeModal = document.getElementById("closeModal");

  let currentPage = 1;
  let submissions = [];

  async function fetchSubmissions(page = 1, status = "all", dateRange = "all") {
    try {
      const statusParam = status === "all" ? "" : status.toUpperCase();
      const url = new URL("/system-users-contribution", window.location.origin);
      url.searchParams.append("page", page);
      url.searchParams.append("status", statusParam);
      url.searchParams.append("dateRange", dateRange);

      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch submissions");

      const { submissions: fetchedSubmissions, pagination } =
        await response.json();
      submissions = fetchedSubmissions;
      currentPage = pagination.currentPage;
      totalPages = pagination.totalPages;

      return { submissions: fetchedSubmissions, pagination };
    } catch (error) {
      console.error("Error fetching submissions:", error);
      return { submissions: [], pagination: {} };
    }
  }

  async function loadSubmissions() {
    const status = statusFilter.value;
    const dateRange = dateFilter.value;

    const { submissions: fetchedSubmissions } = await fetchSubmissions(
      currentPage,
      status,
      dateRange
    );
    populateApprovalItems(fetchedSubmissions);
  }

  approvalItems.addEventListener("click", async (e) => {
    if (e.target.classList.contains("view-details")) {
      const submissionId = parseInt(e.target.getAttribute("data-id"));
      const selectedSubmission = submissions.find((s) => s.id === submissionId);

      if (selectedSubmission) {
        showModal(selectedSubmission);
      } else {
        console.error("Submission not found");
      }
    }
  });

  async function updateSubmissionStatus(submissionId, status) {
    try {
      const response = await fetch("/contribution-status-updation", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          status: status.toUpperCase(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update submission status");

      const result = await response.json();
      return result.submission;
    } catch (error) {
      alert(error.message);
      return null;
    }
  }

  // Create submission item element
  function createApprovalItem(submission) {
    console.log({ submission });
    const approvalItem = document.createElement("div");
    approvalItem.className = "approval-item";
    approvalItem.innerHTML = `
            <div class="approval-item-details">
                <h3>${submission.itemType}</h3>
                <p>User: ${submission.fullName}</p>
                <p>Date: ${new Date(
                  submission.createdAt
                ).toLocaleDateString()}</p>
                <p>Weight: ${submission.weight} kg</p>
            </div>
            <div class="approval-item-status status-${submission.status.toLowerCase()}">
                ${
                  submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1).toLowerCase()
                }
            </div>
            <button class="btn-primary view-details" data-id="${
              submission.id
            }">View Details</button>
        `;
    return approvalItem;
  }

  function populateApprovalItems(submissions) {
    approvalItems.innerHTML = "";
    submissions.forEach((submission) => {
      const approvalItem = createApprovalItem(submission);
      approvalItems.appendChild(approvalItem);
    });
  }

  function showModal(submission) {
    modalContent.innerHTML = `
            <h3>${submission.itemType}</h3>
            <p><strong>User:</strong> ${submission.fullName}</p>
            <p><strong>Email:</strong> ${submission.email}</p>
            <p><strong>Date:</strong> ${new Date(
              submission.createdAt
            ).toLocaleDateString()}</p>
            <p><strong>Weight:</strong> ${submission.weight} kg</p>
            <p><strong>Description:</strong> ${submission.description}</p>
            <p><strong>Status:</strong> <span class="status-${submission.status.toLowerCase()}">
                ${
                  submission.status.charAt(0).toUpperCase() +
                  submission.status.slice(1).toLowerCase()
                }
            </span></p>
            ${
              submission.imageUrl
                ? `<img src="${submission.imageUrl}" alt="Submission Image" class="submission-image">`
                : ""
            }
        `;
    approvalModal.style.display = "block";

    approveBtn.onclick = async () => {
      const updatedSubmission = await updateSubmissionStatus(
        submission.id,
        "APPROVED"
      );
      if (updatedSubmission) {
        approvalModal.style.display = "none";
        loadSubmissions();
      }
    };

    rejectBtn.onclick = async () => {
      const updatedSubmission = await updateSubmissionStatus(
        submission.id,
        "REJECTED"
      );
      if (updatedSubmission) {
        approvalModal.style.display = "none";
        loadSubmissions();
      }
    };
  }

  applyFiltersBtn.addEventListener("click", () => {
    currentPage = 1;
    loadSubmissions();
  });

  approvalItems.addEventListener("click", async (e) => {
    if (e.target.classList.contains("view-details")) {
      const submissionId = parseInt(e.target.getAttribute("data-id"));
      const submission = await fetchSubmissions();
      const selectedSubmission = submissions.find((s) => s.id === submissionId);
      if (selectedSubmission) {
        showModal(selectedSubmission);
      }
    }
  });

  closeModal.addEventListener("click", () => {
    approvalModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === approvalModal) {
      approvalModal.style.display = "none";
    }
  });

  await loadSubmissions();
});
