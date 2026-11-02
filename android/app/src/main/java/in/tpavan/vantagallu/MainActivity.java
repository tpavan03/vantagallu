package in.tpavan.vantagallu;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Device automation is available only in the isolated debug package.
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
    }
}
