"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { receiptSystem } from "@/lib/receipt-system"
import { Upload, X, FileImage, Check, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ReceiptUploadModalProps {
    isOpen: boolean
    onClose: () => void
    requestId: string
    requestTitle: string
    onUploadComplete?: () => void
}

export default function ReceiptUploadModal({
    isOpen,
    onClose,
    requestId,
    requestTitle,
    onUploadComplete,
}: ReceiptUploadModalProps) {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [receiptNumber, setReceiptNumber] = useState("")
    const [amount, setAmount] = useState("")
    const [donorName, setDonorName] = useState("")
    const [notes, setNotes] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return

        const validFiles = Array.from(files).filter((file) => {
            const isValidType = file.type.startsWith("image/") || file.type === "application/pdf"
            const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit

            if (!isValidType) {
                toast({
                    title: "ไฟล์ไม่ถูกต้อง",
                    description: `${file.name} ไม่ใช่ไฟล์รูปภาพหรือ PDF`,
                    variant: "destructive",
                })
                return false
            }

            if (!isValidSize) {
                toast({
                    title: "ไฟล์ใหญ่เกินไป",
                    description: `${file.name} มีขนาดเกิน 10MB`,
                    variant: "destructive",
                })
                return false
            }

            return true
        })

        setUploadedFiles((prev) => [...prev, ...validFiles])
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files)
        }
    }

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (uploadedFiles.length === 0) {
            toast({
                title: "กรุณาเลือกไฟล์",
                description: "กรุณาอัปโหลดสลิปหรือใบเสร็จ",
                variant: "destructive",
            })
            return
        }

        setIsUploading(true)

        try {
            // Simulate file upload process
            await new Promise((resolve) => setTimeout(resolve, 2000))

            // Create receipt record with uploaded files
            const receipt = receiptSystem.createReceipt({
                donationId: `manual_${Date.now()}`,
                requestId,
                requestTitle,
                donorId: "manual_upload", // For manual uploads
                donorName: donorName || "ไม่ระบุชื่อ",
                amount: amount ? Number(amount) : undefined,
                type: "money", // Assume money donation for receipt uploads
                paymentMethod: "Manual Upload",
                transactionId: receiptNumber,
                message: notes,
                isAnonymous: !donorName,
                pointsEarned: 0, // No points for manual uploads
            })

            // In a real app, files would be uploaded to cloud storage
            // For now, we'll store file names in localStorage
            const fileData = uploadedFiles.map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file), // Temporary URL for demo
            }))

            localStorage.setItem(`receipt_files_${receipt.id}`, JSON.stringify(fileData))

            toast({
                title: "อัปโหลดสำเร็จ",
                description: "สลิปการรับเงินได้ถูกบันทึกแล้ว",
            })

            // Reset form
            setUploadedFiles([])
            setReceiptNumber("")
            setAmount("")
            setDonorName("")
            setNotes("")

            onUploadComplete?.()
            onClose()
        } catch (error) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    const resetForm = () => {
        setUploadedFiles([])
        setReceiptNumber("")
        setAmount("")
        setDonorName("")
        setNotes("")
        setIsUploading(false)
        setDragActive(false)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>อัปโหลดสลิปการรับเงิน</DialogTitle>
                    <p className="text-sm text-gray-600">สำหรับ: {requestTitle}</p>
                </DialogHeader>

                <div className="space-y-6">
                    {/* File Upload Area */}
                    <div className="space-y-4">
                        <Label>สลิปการรับเงิน / ใบเสร็จ *</Label>

                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                            <p className="text-sm text-gray-500 mb-4">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 10MB</p>
                            <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                                เลือกไฟล์
                            </Button>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>ไฟล์ที่เลือก ({uploadedFiles.length})</Label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {uploadedFiles.map((file, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <FileImage className="w-5 h-5 text-blue-600" />
                                                        <div>
                                                            <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Receipt Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="receiptNumber">เลขที่ใบเสร็จ / รหัสอ้างอิง</Label>
                            <Input
                                id="receiptNumber"
                                placeholder="เช่น RCP-001234"
                                value={receiptNumber}
                                onChange={(e) => setReceiptNumber(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="donorName">ชื่อผู้บริจาค (ไม่บังคับ)</Label>
                        <Input
                            id="donorName"
                            placeholder="ระบุชื่อผู้บริจาค หรือเว้นว่างหากไม่ประสงค์ออกนาม"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">หมายเหตุเพิ่มเติม</Label>
                        <Textarea
                            id="notes"
                            placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการรับเงิน..."
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">ข้อมูลสำคัญ:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• สลิปที่อัปโหลดจะถูกเก็บไว้เป็นหลักฐานการรับเงิน</li>
                                    <li>• ข้อมูลจะถูกใช้สำหรับการออกใบเสร็จและรายงาน</li>
                                    <li>• กรุณาตรวจสอบความถูกต้องของข้อมูลก่อนอัปโหลด</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleUpload} disabled={isUploading || uploadedFiles.length === 0} className="flex-1">
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    กำลังอัปโหลด...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    อัปโหลดสลิป
                                </>
                            )}
                        </Button>
                        <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                            ยกเลิก
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
