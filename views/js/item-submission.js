document.addEventListener("DOMContentLoaded", () => {
  const itemSubmissionForm = document.getElementById("itemSubmissionForm");
  const itemImages = document.getElementById("itemImages");
  const imagePreview = document.getElementById("imagePreview");
  const itemList = document.getElementById("itemList");

  itemImages.addEventListener("change", (e) => {
    imagePreview.innerHTML = "";
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.file = file;
        imagePreview.appendChild(img);

        const reader = new FileReader();
        reader.onload = (function (aImg) {
          return function (e) {
            aImg.src = e.target.result;
          };
        })(img);
        reader.readAsDataURL(file);
      }
    }
  });

  itemSubmissionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const files = itemImages.files;

    for (let i = 0; i < files.length; i++) {
      formData.append("image", files[i]);
      console.log("Appending file:", files[i]);
    }

    try {
      const response = await fetch("/new-item", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        if (response.ok) {
          alert("Item added successfully!");
          itemSubmissionForm.reset();
          imagePreview.innerHTML = "";
          fetchItems();
        } else {
          throw new Error(result.message || "Failed to add item");
        }
      } else {
        const text = await response.text();
        throw new Error(`Received non-JSON response: ${text}`);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("An error occurred while adding the item: " + error.message);
    }
  });

  async function fetchItems() {
    try {
      const response = await fetch("/items", {
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        if (response.ok) {
          itemList.innerHTML = result.items
            .map((item) => {
              const shortDescription =
                item.description.length > 50
                  ? `${item.description.slice(0, 50)}...`
                  : item.description;
              return `
                            <div class="item-card">
                                <img src="${
                                  item.imageUrl ||
                                  "../../assets/images/placeholder.png"
                                }" alt="Item Image" />
                                <h3>${item.itemType}</h3>
                                <p>Condition: ${item.condition}</p>
                                <p>Weight: ${item.weight} kg</p>
                                <p>${shortDescription}</p>
                                <button class="edit-btn" data-id="${
                                  item.id
                                }">Edit</button>
                                <button class="delete-btn" data-id="${
                                  item.id
                                }">Delete</button>
                            </div>`;
            })
            .join("");
        } else {
          throw new Error(result.message || "Failed to fetch items");
        }
      } else {
        const text = await response.text();
        throw new Error(`Received non-JSON response: ${text}`);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      alert("Failed to fetch items: " + error.message);
    }
  }

  fetchItems();

  // Delete item functionality
  itemList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const itemId = e.target.dataset.id;
      const confirmDelete = confirm(
        "Are you sure you want to delete this item?"
      );
      if (confirmDelete) {
        try {
          const response = await fetch(`/remove-item/${itemId}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          alert("Item deleted successfully!");
          fetchItems();
        } catch (error) {
          console.error("Error deleting item:", error);
          alert("Failed to delete item: " + error.message);
        }
      }
    }
  });

  itemList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
      const itemId = e.target.dataset.id;

      try {
        const response = await fetch(`/item/${itemId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        document.getElementById("editItemDescription").value =
          result.item.description;
        document.getElementById("editItemWeight").value = result.item.weight;
        document.getElementById("updateItemBtn").dataset.id = itemId;
        openModal();
      } catch (error) {
        console.error("Error fetching item:", error);
        alert("Failed to fetch item: " + error.message);
      }
    }
  });

  document
    .getElementById("updateItemBtn")
    .addEventListener("click", async (e) => {
      const itemId = e.target.dataset.id;
      const formData = new FormData(document.getElementById("editItemForm"));

      try {
        const response = await fetch(`/update-item/${itemId}`, {
          method: "PUT",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert("Item updated successfully!");
        closeModal();
        fetchItems();
      } catch (error) {
        console.error("Error updating item:", error);
        alert("Failed to update item: " + error.message);
      }
    });

  const modal = document.getElementById("editModal");
  const closeBtn = document.querySelector(".close");

  function openModal() {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  closeBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModal();
    }
  });
});
