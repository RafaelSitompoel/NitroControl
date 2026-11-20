using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Security.Principal;
using System.Threading;

namespace NitroControl
{
    static class Program
    {
        static bool IsAdministrator()
        {
            try
            {
                WindowsIdentity identity = WindowsIdentity.GetCurrent();
                WindowsPrincipal principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
            catch
            {
                return false;
            }
        }

        static bool IsPortInUse(int port)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(400);
                    if (success)
                    {
                        client.EndConnect(result);
                        return true;
                    }
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        static void KillProcessOnPort(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("powershell",
                    "-NoProfile -Command \"Get-NetTCPConnection -LocalPort " + port + " -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }\"")
                {
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                Process p = Process.Start(psi);
                p.WaitForExit(3000);
            }
            catch { }
        }

        [STAThread]
        static void Main(string[] args)
        {
            if (!IsAdministrator())
            {
                ProcessStartInfo elevateInfo = new ProcessStartInfo
                {
                    UseShellExecute = true,
                    WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory,
                    FileName = Process.GetCurrentProcess().MainModule.FileName,
                    Verb = "runas"
                };

                try
                {
                    Process.Start(elevateInfo);
                    return;
                }
                catch
                {
                }
            }

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string daemonPath = Path.Combine(appDir, "nitrocontrol-backend.exe");

            if (IsAdministrator() && IsPortInUse(7878))
            {
                KillProcessOnPort(7878);
                Thread.Sleep(600);
            }

            if (!IsPortInUse(7878))
            {
                if (File.Exists(daemonPath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo(daemonPath, "--no-window")
                    {
                        WorkingDirectory = appDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    try
                    {
                        Process.Start(psi);
                    }
                    catch { }

                    for (int i = 0; i < 30; i++)
                    {
                        Thread.Sleep(200);
                        if (IsPortInUse(7878)) break;
                    }
                }
            }

            string[] browserPaths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe"
            };

            string browserPath = null;
            foreach (var p in browserPaths)
            {
                if (File.Exists(p))
                {
                    browserPath = p;
                    break;
                }
            }

            string appDataDir = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string userDataDir = Path.Combine(appDataDir, "NitroControl", "desktop_cache");

            if (browserPath != null)
            {
                ProcessStartInfo appPsi = new ProcessStartInfo(
                    browserPath,
                    "--app=http://127.0.0.1:7878 --window-size=1280,850 --user-data-dir=\"" + userDataDir + "\""
                )
                {
                    UseShellExecute = false
                };

                try
                {
                    Process.Start(appPsi);
                }
                catch { }
            }
            else
            {
                Process.Start("http://127.0.0.1:7878");
            }
        }
    }
}
