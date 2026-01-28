/**
 * QR Code Extractor
 * สแกน QR code จากรูปภาพ (ใช้ jsqr)
 */

/**
 * อ่าน QR Code payload จากรูปภาพ
 */
export async function extractQRPayloadFromImage(imageUrl: string): Promise<string | null> {
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image()
            i.crossOrigin = "anonymous"
            i.onload = () => resolve(i)
            i.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"))
            i.src = imageUrl
        })

        // ลองอ่าน QR Code
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        const { default: jsqr } = await import("jsqr")
        const qr = jsqr(imageData.data, imageData.width, imageData.height)
        
        if (qr && qr.data) {
            return qr.data
        }

        // ลองอีกครั้งด้วยขนาดที่เล็กลง
        const targetWidth = Math.min(800, img.naturalWidth)
        const scale = targetWidth / img.naturalWidth
        canvas.width = targetWidth
        canvas.height = Math.floor(img.naturalHeight * scale)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resizedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const qr2 = jsqr(resizedImageData.data, resizedImageData.width, resizedImageData.height)
        
        if (qr2 && qr2.data) {
            return qr2.data
        }

        return null
    } catch (error) {
        console.error("Error extracting QR payload:", error)
        return null
    }
}
