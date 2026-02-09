document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  let messageHideTimeoutId;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    if (messageHideTimeoutId) {
      clearTimeout(messageHideTimeoutId);
    }

    messageHideTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
      messageHideTimeoutId = undefined;
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length) {
          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = participant;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "participant-remove";
            button.setAttribute("data-activity", name);
            button.setAttribute("data-email", participant);
            button.setAttribute("aria-label", `Remove ${participant} from ${name}`);
            button.title = "Remove participant";

            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("focusable", "false");

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h2v9H6V9z");

            svg.appendChild(path);
            button.appendChild(svg);
            li.appendChild(span);
            li.appendChild(button);
            participantsList.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participants-empty";
          li.textContent = "No participants yet";
          participantsList.appendChild(li);
        }

        // Create activity card content
        const h4 = document.createElement("h4");
        h4.textContent = name;

        const descP = document.createElement("p");
        descP.textContent = details.description;

        const schedP = document.createElement("p");
        const schedStrong = document.createElement("strong");
        schedStrong.textContent = "Schedule:";
        schedP.appendChild(schedStrong);
        schedP.appendChild(document.createTextNode(" " + details.schedule));

        const availP = document.createElement("p");
        const availStrong = document.createElement("strong");
        availStrong.textContent = "Availability:";
        availP.appendChild(availStrong);
        availP.appendChild(document.createTextNode(" " + spotsLeft + " spots left"));

        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsLabel = document.createElement("p");
        const participantsStrong = document.createElement("strong");
        participantsStrong.textContent = "Participants:";
        participantsLabel.appendChild(participantsStrong);

        participantsDiv.appendChild(participantsLabel);
        participantsDiv.appendChild(participantsList);

        activityCard.appendChild(h4);
        activityCard.appendChild(descP);
        activityCard.appendChild(schedP);
        activityCard.appendChild(availP);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const button = event.target.closest(".participant-remove");
    if (!button) {
      return;
    }

    const activity = decodeURIComponent(button.dataset.activity || "");
    const email = decodeURIComponent(button.dataset.email || "");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
