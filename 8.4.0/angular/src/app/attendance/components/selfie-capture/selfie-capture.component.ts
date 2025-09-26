import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'app-selfie-capture',
    templateUrl: './selfie-capture.component.html'
})
export class SelfieCaptureComponent implements OnInit, OnDestroy {
    @ViewChild('video', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvas', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

    @Output() photoCapture = new EventEmitter<string>();
    @Output() cancel = new EventEmitter<void>();

    stream: MediaStream | null = null;
    capturedPhoto: string | null = null;
    isCapturing = false;
    cameraError = false;
    errorMessage = '';

    ngOnInit(): void {
        this.startCamera();
    }

    ngOnDestroy(): void {
        this.stopCamera();
    }

    async startCamera(): Promise<void> {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (this.videoElement && this.videoElement.nativeElement) {
                this.videoElement.nativeElement.srcObject = this.stream;
            }
        } catch (error) {
            console.error('Camera access error:', error);
            this.cameraError = true;
            this.errorMessage = 'Unable to access camera. Please check permissions.';
        }
    }

    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    capturePhoto(): void {
        if (!this.videoElement || !this.canvasElement) {
            return;
        }

        const video = this.videoElement.nativeElement;
        const canvas = this.canvasElement.nativeElement;
        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to data URL
        this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
        this.isCapturing = false;

        // Stop camera after capture
        this.stopCamera();
    }

    retake(): void {
        this.capturedPhoto = null;
        this.isCapturing = true;
        this.startCamera();
    }

    confirmPhoto(): void {
        if (this.capturedPhoto) {
            this.photoCapture.emit(this.capturedPhoto);
        }
    }

    onCancel(): void {
        this.stopCamera();
        this.cancel.emit();
    }
}