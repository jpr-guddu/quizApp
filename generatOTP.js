// -------------------- EmailJS Init --------------------
(function () {
    emailjs.init("6aW5MFWnKe3B9E4mW");
})();

let generatedOTP = "";

// -------------------- SEND OTP --------------------
function sendOTP() {
    const email = document.getElementById("email").value.trim();
    const msg = document.getElementById("msg");

    if (!email) {
        msg.innerText = "Please enter email!";
        return;
    }

    // Generate OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const expiryTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString();

    const params = {
        user_email: email,
        passcode: generatedOTP,
        time: expiryTime
    };

    emailjs.send("service_2fn7tzv", "template_at93rja", params)
        .then(() => {
            msg.style.color = "green";
            msg.innerText = "OTP sent to your email!";
            document.getElementById("step2").style.display = "block";
            document.getElementById("boxy").style.display = "none";
        })
        .catch(error => {
            msg.style.color = "red";
            msg.innerText = "Failed to send OTP!";
            console.error(error);
        });
}

// Button listener
document.getElementById("guddu").addEventListener("click", sendOTP);

// -------------------- VERIFY OTP --------------------
function verifyOTP() {
    const otpEntered = document.getElementById("otpInput").value.trim();
    const msg = document.getElementById("message");

    if (otpEntered === generatedOTP) {
        msg.style.color = "green";
        msg.innerHTML = "<b>OTP Verified ✔</b>";
        signup();
        setTimeout(() => {
            window.location.href = "signUp.html"; 
        }, 1000);
    } else {
        msg.style.color = "red";
        msg.innerHTML = "<b>Invalid OTP ❌</b>";
    }
}

document.getElementById("verifyguddu").addEventListener("click", verifyOTP);

// -------------------- FIREBASE SETUP --------------------
const firebaseConfig = {
    apiKey: "AIzaSyBUPXbKjKybtj5w9wYUKLj8F1WbDnwI_PE",
    authDomain: "myfirstproject-a9bd5.firebaseapp.com",
    databaseURL: "https://myfirstproject-a9bd5-default-rtdb.firebaseio.com",
    projectId: "myfirstproject-a9bd5",
    storageBucket: "myfirstproject-a9bd5.firebasestorage.app",
    messagingSenderId: "565178101938",
    appId: "1:565178101938:web:36cde7a47e08b2e79a59ab"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// -------------------- SIGNUP FUNCTION --------------------
function signup() {
    let name = document.getElementById("name").value.trim();
    let email = document.getElementById("email").value.trim();
    let gender = document.getElementById("gender").value.trim();
    let age = document.getElementById("age").value.trim();
    let dob = document.getElementById("dob").value;
    let password = document.getElementById("password").value.trim();
    let msg = document.getElementById("msg");

    if (!name || !email || !gender || !age || !dob || !password) {
        msg.style.color = "red";
        msg.innerText = "Please fill all fields!";
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            const user = cred.user;

            user.sendEmailVerification().then(() => {
                msg.style.color = "green";
                msg.innerText = "Verification email sent! Check inbox.";

                db.ref("users/" + user.uid).set({
                    name,
                    email,
                    gender,
                    age,
                    dob,
                    verified: false
                });

                // Auto check for verification
                const interval = setInterval(() => {
                    user.reload().then(() => {
                        if (user.emailVerified) {
                            clearInterval(interval);

                            db.ref("users/" + user.uid).update({ verified: true });

                            window.location.href = "quiz.html";
                        }
                    });
                }, 2000);
            });
        })
        .catch(error => {
            msg.style.color = "red";
            msg.innerText = error.message;
        });
}
