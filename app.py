from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

def detect_distress_level(text):
    text = text.lower()
    if any(word in text for word in ["hopeless", "worthless", "suicide", "die"]):
        return "high"
    elif any(word in text for word in ["overwhelmed", "empty", "very sad"]):
        return "medium"
    else:
        return "low"

@app.route("/")
def home():
    return "Backend Running"

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    user_text = data.get("text", "")

    level = detect_distress_level(user_text)

    if level == "high":
        tone = "Be extremely gentle and comforting."
    elif level == "medium":
        tone = "Be calming and supportive."
    else:
        tone = "Be warm and friendly."

    prompt = f"""
You are a caring emotional support companion.
{tone}
Do not give medical advice.
Encourage the user to share feelings.

User said: "{user_text}"
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": "phi3", "prompt": prompt, "stream": False}
        )

        result = response.json()
        reply = result.get("response", "I'm here with you.")
        return jsonify({"reply": reply})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"reply": "AI connection error."})

if __name__ == "__main__":
    app.run(debug=True)
