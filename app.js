import React, { useState, useRef } from 'react';

function VoiceComponent() {
    const [status, setStatus] = useState("請點擊開始錄音");
    const [transcription, setTranscription] = useState("");
    const socketRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);

    const startRecording = async () => {
        // 1. 從 Kaggle 後端獲取完整的 https URL
        const ngrokUrl = "https://2af76ba66353.ngrok-free.app"; // <-- 貼上後端打印出的 URL

        // 2. 將 https:// 替換為 wss://
        const wsUrl = ngrokUrl.replace("https://", "wss://");
        
        setStatus(`正在連接到 ${wsUrl}...`);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            socketRef.current = new WebSocket(wsUrl);

            socketRef.current.onopen = () => {
                setStatus("✅ 連線成功！正在錄音...");
                
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
                        socketRef.current.send(event.data);
                    }
                };

                recorder.start(5500); // 每 2 秒發送一次
            };

            socketRef.current.onmessage = (event) => {
                setTranscription(prev => prev + event.data + '\n');
            };

            socketRef.current.onerror = (error) => {
                console.error("WebSocket Error:", error);
                setStatus("❌ 連線錯誤！");
            };

            socketRef.current.onclose = () => {
                setStatus("連線已關閉。");
                // 可以在這裡添加清理邏輯
            };

        } catch (err) {
            console.error("Media Device Error:", err);
            setStatus("❌ 無法獲取麥克風權限！");
        }
    };

    // ... 其他組件邏輯 (停止按鈕等)

    return (
        <div>
            <h1>實時語音轉寫</h1>
            <button onClick={startRecording}>開始錄音</button>
            {/* ... 其他 UI ... */}
            <div>{status}</div>
            <pre>{transcription}</pre>
        </div>
    );
}

export default VoiceComponent;