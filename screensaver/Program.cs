// Koi pond screensaver: shows the pond deployed on Vercel full screen in WebView2 (Edge's engine, so WebGL works) and quits on any
// key, click, scroll or real mouse move. With "On resume, display logon screen" ticked, Windows asks for the password
// afterwards, so the pond plays while the PC stays locked. Other monitors stay black.
//
// Build on Windows (.NET 8 SDK):  dotnet publish -c Release
//   -> bin\Release\net8.0-windows\win-x64\publish\KoiScreensaver.scr  (right-click -> Install)
// Needs the internet; while the site can't be reached, a "waiting" page retries every 5 s.

using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class Program
{
    public const string Url = "https://kois-three.vercel.app/?screensaver";

    [STAThread]
    static void Main(string[] args)
    {
        // Windows passes /s (run), /p <hwnd> (preview in the settings dialog) or /c (settings), sometimes as "/c:1234"
        var arg = args.FirstOrDefault()?.TrimStart('/', '-').ToLowerInvariant() ?? "";
        var mode = arg.Length > 0 ? arg[0] : 'c';
        if (mode == 'p') return;   // no live preview in the little monitor

        ApplicationConfiguration.Initialize();
        if (mode != 's')
        {
            MessageBox.Show($"Shows {Url}\nNothing to configure.", "Koi screensaver");
            return;
        }

        foreach (var screen in Screen.AllScreens)
            new SaverForm(screen).Show();
        Cursor.Hide();

        // the WebView swallows mouse events, so watch the cursor itself; a few pixels of jitter are ignored
        var start = Cursor.Position;
        var timer = new System.Windows.Forms.Timer { Interval = 100 };
        timer.Tick += (_, _) =>
        {
            var p = Cursor.Position;
            if (Math.Abs(p.X - start.X) + Math.Abs(p.Y - start.Y) > 12) Application.Exit();
        };
        timer.Start();

        Application.Run();
    }
}

sealed class SaverForm : Form
{
    // keys, clicks and the wheel inside the page; the cursor is hidden over the page too
    const string Script = """
        const quit = () => chrome.webview.postMessage('quit');
        for (const t of ['keydown', 'pointerdown', 'wheel']) addEventListener(t, quit, true);
        addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style'); s.textContent = '* { cursor: none !important; }'; document.head.append(s);
        });
        """;

    const string Waiting = $"""
        <!doctype html><meta http-equiv="refresh" content="5;url={Program.Url}">
        <body style="margin:0;height:100vh;display:grid;place-items:center;background:#000;color:#555;font:16px sans-serif">
        Waiting for {Program.Url}
        """;

    public SaverForm(Screen screen)
    {
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        Bounds = screen.Bounds;
        BackColor = Color.Black;
        TopMost = true;
        ShowInTaskbar = false;
        KeyPreview = true;
        KeyDown += (_, _) => Application.Exit();
        MouseDown += (_, _) => Application.Exit();
        if (screen.Primary) Load += async (_, _) => await ShowPond();
    }

    async Task ShowPond()
    {
        var web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.Black };
        Controls.Add(web);
        // the .scr may live in C:\Windows, which is not writable: keep the browser profile in AppData
        var dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KoiScreensaver");
        // no one clicks a screensaver: let the music start without a user gesture
        var options = new CoreWebView2EnvironmentOptions("--autoplay-policy=no-user-gesture-required");
        await web.EnsureCoreWebView2Async(await CoreWebView2Environment.CreateAsync(null, dataDir, options));

        var core = web.CoreWebView2;
        core.Settings.AreDefaultContextMenusEnabled = false;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        await core.AddScriptToExecuteOnDocumentCreatedAsync(Script);
        core.WebMessageReceived += (_, _) => Application.Exit();
        core.NavigationCompleted += (_, e) => { if (!e.IsSuccess) core.NavigateToString(Waiting); };
        core.Navigate(Program.Url);
        web.Focus();
    }
}
