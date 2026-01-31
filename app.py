from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# ---------------- EMOTIONAL DISTRESS DETECTION ----------------
def detect_distress_level(text):
    text = text.lower()

    if any(word in text for word in ["hopeless", "worthless", "suicide", "die"]):
        return "high"
    elif any(word in text for word in ["overwhelmed", "empty", "very sad"]):
        return "medium"
    else:
        return "low"


# ---------------- HOME ROUTE ----------------
@app.route("/")
def home():
    return "Backend Running"


# ---------------- MAIN AI ROUTE ----------------
@app.route("/analyze", methods=["POST"])
def analyze():
    # Handle JSON or FormData
    if request.is_json:
        data = request.get_json()
        user_text = data.get("text", "")
    else:
        user_text = request.form.get("text", "")

    print("Received text:", user_text)

    level = detect_distress_level(user_text)

    # Adjust tone based on emotional intensity
    if level == "high":
        tone = "Be extremely gentle, slow, and comforting."
    elif level == "medium":
        tone = "Be calming, supportive, and reassuring."
    else:
        tone = "Be warm, friendly, and encouraging."

    # Prompt for AI
    prompt = f"""
You are a caring emotional support companion.
{tone}
Do not give medical advice.
Encourage the user to share feelings.

User said: "{user_text}"
"""

    try:
        # Send prompt to local Phi-3 model via Ollama
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3",
                "prompt": prompt,
                "stream": False
            }
        )

        result = response.json()
        reply = result.get("response", "I'm here with you. Tell me more.")

        return jsonify({"reply": reply})

    except Exception as e:
        print("AI ERROR:", e)
        return jsonify({"reply": "I'm here with you. Something went wrong."})


if __name__ == "__main__":
    app.run(debug=True)
