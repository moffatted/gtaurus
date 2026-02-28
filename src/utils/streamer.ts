/**
 * @file streamer.ts
 * @purpose Core G-code streaming logic, managing the controller's receive buffer and command queuing.
 */
export class GCodeStreamer {
  private rxBufferMax = 127; // DLC32 standard is 128, stay 1 safe
  private currentBufferFill = 0;
  private queue: string[] = [];
  private pendingLineLengths: number[] = [];

  // Job tracking for resuming/recovery
  public totalLines = 0;
  public sentLines = 0;
  public ackedLines = 0;
  private isPaused = false;

  // Callbacks
  public onSend?: (gcode: string) => Promise<void>;
  public onAck?: (lineNumber: number) => void;
  public onComplete?: () => void;

  public loadGcode(commands: string[]) {
    // Clean and queue all valid commands
    this.queue = commands
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith(';'));
    
    this.totalLines = this.queue.length;
    this.sentLines = 0;
    this.ackedLines = 0;
    this.currentBufferFill = 0;
    this.pendingLineLengths = [];
    this.isPaused = false;
  }

  public start() {
    this.isPaused = false;
    this.processQueue();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.processQueue();
  }

  // Add a single line to the queue dynamically
  public addToQueue(line: string) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith(';')) return;
    
    this.queue.push(cleanLine);
    this.totalLines++;
    if (!this.isPaused) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isPaused) return;

    while (this.queue.length > 0) {
      const nextLine = this.queue[0];
      // Every line sent must be appended with '\n' which adds 1 to the length
      const lineLength = nextLine.length + 1; 

      // Only send if it fits in the RX buffer
      if (this.currentBufferFill + lineLength <= this.rxBufferMax) {
        this.queue.shift(); // Remove from pending queue
        this.currentBufferFill += lineLength;
        this.pendingLineLengths.push(lineLength);
        this.sentLines++;

        if (this.onSend) {
          await this.onSend(nextLine + '\n');
        }
      } else {
        // Buffer full, wait for an 'ok' to clear space
        break;
      }
    }

    // Check completion
    if (this.queue.length === 0 && this.pendingLineLengths.length === 0 && !this.isPaused) {
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  // Call this when the controller returns 'ok'
  public onOkReceived() {
    const lengthCleared = this.pendingLineLengths.shift();
    if (lengthCleared !== undefined) {
      this.currentBufferFill = Math.max(0, this.currentBufferFill - lengthCleared);
      this.ackedLines++;
      
      if (this.onAck) {
        this.onAck(this.ackedLines);
      }

      // Try sending more
      if (!this.isPaused) {
        this.processQueue();
      }
    }
  }

  // Handle hardware reset or alarm (clear buffer knowledge)
  public onEmergencyStop() {
    this.isPaused = true;
    this.currentBufferFill = 0;
    this.pendingLineLengths = [];
    // The hardware buffer is flushed during a reset.
    // However, the sent lines that were not acked might need to be 
    // pushed back onto the queue if we want to auto-recover.
  }

  public getPendingCount(): number {
    return this.pendingLineLengths.length;
  }

  public getBufferFill(): number {
    return this.currentBufferFill;
  }
}
