import subprocess
import sys
import os
import signal
import time

def main():
    project_root = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(project_root, "backend")
    frontend_dir = os.path.join(project_root, "frontend")

    print("=" * 55)
    print("Starting Mutual Fund Screener Application...")
    print("=" * 55)

    # Start FastAPI Backend
    print("[1/2] Starting Backend Server (FastAPI on port 8000)...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    time.sleep(1)

    # Start Next.js Frontend
    print("[2/2] Starting Frontend Server (Next.js on port 3000)...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "=" * 55)
    print("🚀 App running!")
    print("  • Frontend: http://localhost:3000")
    print("  • Backend:  http://localhost:8000")
    print("Press [Ctrl+C] to stop both servers.")
    print("=" * 55 + "\n")

    def handle_exit(signum, frame):
        print("\nStopping servers...")
        try:
            frontend_process.terminate()
            backend_process.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    # Keep script alive until interrupt
    try:
        frontend_process.wait()
    except KeyboardInterrupt:
        handle_exit(None, None)

if __name__ == "__main__":
    main()
