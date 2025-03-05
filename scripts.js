var screenshot = null;
var name = null;
var email = null;
var reward = null;


document.addEventListener("DOMContentLoaded", function () {
    let startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.addEventListener("click", startChat);
    }

    if (sessionStorage.getItem("chatState")) {
        restoreChat();
    }
});

let chatStarted = false;
let chatHistory = [];

function saveChatState() {
    sessionStorage.setItem("chatState", JSON.stringify(chatHistory));
}

function restoreChat() {
    let savedChat = sessionStorage.getItem("chatState");
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        chatHistory.forEach(entry => {
            
            addMessage(entry.text, "bot");
            if (entry.options.length > 0) {
                addButton(entry.options, entry.callback);
            }
        });
    }
}

function startChat() {
    if (chatStarted) return;
    chatStarted = true;

    document.getElementById("start-button").style.display = "none";
    document.getElementById("chat-header").style.display = "block";
    document.getElementById("chat-box").style.display = "block";

    askQuestion("Where would you like to leave your review? (Please take a screenshot after submitting!)", [
        { text: "Google", value: "google" },
        { text: "Facebook", value: "facebook" }
    ], handleReviewPlatform);
}

function askQuestion(text, options = [], callback = null, type = "text") {
    addMessage(text, "bot");
    chatHistory.push({ text, options, callback });
    saveChatState();

    if (options.length > 0) {
        addButton(options, callback);
    } else {
        enableUserInput(callback, type);
    }

    showGoBackButton();
}

function enableUserInput(nextStep, type="text") {
    let userInput = document.getElementById("user-input");
    let sendButton = document.getElementById("send-button");

    userInput.style.display = "block";
    sendButton.style.display = "block";
    userInput.focus();

    sendButton.onclick = function () {
        let inputText = userInput.value.trim();
        if (inputText) {
            if (type === "name") {
                name = inputText;
            } else if (type === "email") {
                email = inputText;
            }

            addMessage("You: " + inputText, "user");
            userInput.value = "";
            userInput.style.display = "none";
            sendButton.style.display = "none";
            if (nextStep) nextStep(inputText);
        }
    };
}

function addMessage(text, sender) {
    let chatBox = document.getElementById("chat-box");
    let msg = document.createElement("div");
    msg.classList.add("chat-message", sender === "user" ? "user-message" : "bot-message");
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}

function addButton(options, callback) {
    let chatBox = document.getElementById("chat-box");
    let buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    options.forEach(option => {
        let button = document.createElement("button");
        button.textContent = option.text;
        button.classList.add("chat-button");
        button.onclick = function () {
            addMessage("You: " + option.text, "user");
            buttonContainer.remove();
            if (callback) callback(option.value);
        };
        buttonContainer.appendChild(button);
    });

    chatBox.appendChild(buttonContainer);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}

function showGoBackButton() {
    let chatBox = document.getElementById("chat-box");
    let existingBackButton = document.getElementById("go-back-button");
    if (existingBackButton) existingBackButton.remove();

    if (chatHistory.length > 1) {
        let backButton = document.createElement("button");
        backButton.textContent = "â† Go Back";
        backButton.id = "go-back-button";
        backButton.classList.add("chat-button");

        backButton.onclick = function () {
            goBack();
        };

        // Wait 500ms so messages appear first, THEN show the button
        setTimeout(() => {
            chatBox.appendChild(backButton);
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 500); // Delay helps reduce distraction
    }
}


function goBack() {
    if (chatHistory.length > 1) {
        chatHistory.pop(); // Remove the current question
        let lastStep = chatHistory.pop(); // Get the previous question
        document.getElementById("chat-box").innerHTML = ""; // Clear chat box

        // Rebuild the chat history up to the lastStep
        chatHistory.forEach(entry => {
            addMessage(entry.text, "bot");
            if (entry.options.length > 0) {
                addButton(entry.options, entry.callback);
            }
        });

        // **Now properly re-ask the lastStep question with its options or input box**
        if (lastStep.options.length > 0) {
            askQuestion(lastStep.text, lastStep.options, lastStep.callback);
        } else {
            askQuestion(lastStep.text, [], lastStep.callback);
        }
    }
    saveChatState();
}

function handleReviewPlatform(platform) {
    sessionStorage.setItem("reviewPlatform", platform);
    saveChatState();

    if (platform === "google") {
        window.open("https://www.google.com/search?q=green+chilli+bangor+reviews", "_blank");
    } else if (platform === "facebook") {
        window.open("https://www.facebook.com/greenchillibangor/reviews/", "_blank");
    }

    setTimeout(() => askForScreenshot(), 3000);
}

function askForScreenshot() {
    askQuestion(": Once you've left your review, upload a screenshot here.");
    addFileUploadOption();
}

function addFileUploadOption() {
    let chatBox = document.getElementById("chat-box");
    let uploadContainer = document.createElement("div");
    uploadContainer.classList.add("upload-container");

    let fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.classList.add("file-input");

    fileInput.addEventListener("change", function () {
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            const file = fileInput.files[0];
            screenshot = file;
            
            addMessage("You uploaded: " + fileInput.files[0].name, "user");
            uploadContainer.remove();
            setTimeout(() => {
                askForName();
            }, 1000);
        }
    });

    uploadContainer.appendChild(fileInput);
    chatBox.appendChild(uploadContainer);
    chatBox.scrollTop = chatBox.scrollHeight;

    // ðŸ”¥ Hide input field & send button during file upload
    document.getElementById("user-input").style.display = "none";
    document.getElementById("send-button").style.display = "none";

    saveChatState();
}


function askForName() {
    askQuestion("Thank you! Please provide your Full Name.", [], askForEmail, "name");
    
}

function askForEmail(name) {
    sessionStorage.setItem("userName", name);
    askQuestion("Now, please provide your Email Address.", [], finalThankYou, 'email');
}

function finalThankYou(email) {
    sessionStorage.setItem("userEmail", email);
    addMessage("Thank you for submitting your details!", "bot");

    let chatBox = document.getElementById("chat-box");
    let spinButton = document.createElement("button");
    spinButton.textContent = "🎰 Spin the Wheel!";
    spinButton.classList.add("chat-button");
    spinButton.onclick = function () {
        spinButton.remove();
        showSpinningWheel(); // Call the new spinning wheel function
    };

    chatBox.appendChild(spinButton);
    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}


// Function to create spinning animation
function showSpinningWheel() {
    let chatBox = document.getElementById("chat-box");

    // Hide other elements and show wheel
    document.getElementById("wheel-container").style.display = "block";

    let canvas = document.getElementById("wheelCanvas");
    let ctx = canvas.getContext("2d");

    let rewards = ["Chips 🍟", "Naan Bread 🍞", "Onion Bhaji 🧅", "Chicken Pakora 🍗"];
    let numSlices = rewards.length;
    let spinAngle = 0;
    let isSpinning = false;
    let spinSpeed = Math.random() * 10 + 20; // Random speed between 20-30
    let spinTime = 3000; // 3 seconds spin duration
    let finalReward = "";

    // Draw Wheel Function
    function drawWheel() {
        let colors = ["#FF5733", "#33FF57", "#3357FF", "#F5A623"];
        let startAngle = 0;
        let sliceAngle = (2 * Math.PI) / numSlices;

        for (let i = 0; i < numSlices; i++) {
            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(150, 150);
            ctx.arc(150, 150, 150, startAngle, startAngle + sliceAngle);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.fillStyle = "#fff";
            ctx.font = "16px Arial";
            ctx.fillText(rewards[i], 50, 10);
            ctx.restore();

            startAngle += sliceAngle;
        }

        // Draw Arrow Indicator
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.moveTo(150, 0);
        ctx.lineTo(140, 30);
        ctx.lineTo(160, 30);
        ctx.fill();
    }

    // Spin Animation Function
    function spinWheel() {
        if (isSpinning) return;
        isSpinning = true;

        let start = Date.now();
        function rotate() {
            let elapsed = Date.now() - start;
            let progress = elapsed / spinTime;
            spinAngle += spinSpeed * (1 - progress);
            spinSpeed *= 0.98; // Gradually slow down

            if (spinSpeed < 0.5) {
                isSpinning = false;
                finalReward = rewards[Math.floor(numSlices - (spinAngle / (2 * Math.PI) * numSlices) % numSlices)];
                document.getElementById("reward-text").innerHTML = `🎉 You won <b>${finalReward}</b>!`;
                saveChatState();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(150, 150);
            ctx.rotate(spinAngle);
            ctx.translate(-150, -150);
            drawWheel();
            ctx.restore();
            requestAnimationFrame(rotate);
        }
        rotate();
    }

    drawWheel();

    // Start spinning when clicked
    canvas.onclick = function () {
        spinWheel();
    };

    chatBox.scrollTop = chatBox.scrollHeight;
    saveChatState();
}
