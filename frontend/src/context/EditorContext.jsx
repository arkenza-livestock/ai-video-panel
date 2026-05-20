import React, { createContext, useState, useEffect } from 'react';

export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState("API Hazırlanıyor...");

    // URL Tanımını Canlı IP ve 3012 Portuna Kesin Olarak Sabitliyoruz
    const API_URL = "http://72.62.186.96:3012";

    useEffect(() => {
        // Backend durumunu kontrol eden tetikleyici
        fetch(`${API_URL}/api/v1/status`)
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error("Backend yanıt vermedi");
            })
            .then((data) => {
                setApiStatus("Hazır");
                console.log("Backend Bağlantısı Başarılı:", data.message);
            })
            .catch((err) => {
                setApiStatus("Bağlantı Hatası");
                console.error("API Bağlantı Hatası:", err);
            });
    }, []);

    // Video Dönüştürme (Export) Fonksiyonunun Tam ve Birleşik Hali
    const exportVideo = async (timelineData) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/export`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ timeline: timelineData }),
            });

            if (!response.ok) {
                throw new Error("Export işlemi backend tarafında başarısız oldu.");
            }

            const result = await response.json();
            alert("Video dönüştürme başarıyla tamamlandı!");
            return result;
        } catch (error) {
            console.error("Export Hatası:", error);
            alert("Video dönüştürme (Export) sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <EditorContext.Provider value={{ project, setProject, loading, apiStatus, exportVideo }}>
            {children}
        </EditorContext.Provider>
    );
};
