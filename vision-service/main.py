import cv2
import mediapipe as mp
import base64
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json

app = FastAPI(title="The Senses - Vision Microservice")

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def process_frame(base64_string):
    """
    Decodes the base64 string, runs MediaPipe Hand Tracking, and returns landmarks.
    """
    try:
        # Decode base64 to numpy array
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
            
        img_data = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return {"error": "Invalid frame data"}

        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        results = hands.process(rgb_frame)
        
        data = {"hands": []}
        
        if results.multi_hand_landmarks:
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                hand_data = {
                    "label": handedness.classification[0].label,  # "Left" or "Right"
                    "score": handedness.classification[0].score,
                    "landmarks": []
                }
                for lm in hand_landmarks.landmark:
                    hand_data["landmarks"].append({
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z
                    })
                data["hands"].append(hand_data)
                
        return data
    except Exception as e:
        return {"error": str(e)}

@app.websocket("/ws/vision")
async def vision_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🔌 Client connected to Vision Service")
    try:
        while True:
            # Wait for base64 frame from client
            payload = await websocket.receive_text()
            
            # Process frame and extract metrics
            result = process_frame(payload)
            
            # Additional Cognitive/Motor Logic could go here:
            # E.g., Reaction Speed, Stability Variance
            
            # Send result back
            await websocket.send_json(result)
            
    except WebSocketDisconnect:
        print("❌ Client disconnected")
    except Exception as e:
        print(f"⚠️ Error: {e}")
        try:
            await websocket.close()
        except:
            pass

@app.get("/")
def health_check():
    return {"status": "ok", "service": "The Senses - Vision Microservice is active"}

if __name__ == "__main__":
    import uvicorn
    # Make sure this runs on port 8000, different from Node.js (5000) and React (5173)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
