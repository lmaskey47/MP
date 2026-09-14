package com.logichain

import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.NativeModule
import com.facebook.react.uimanager.ViewManager

class ScanFeedbackModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "ScanFeedback"
    @ReactMethod
    fun beep(success: Boolean) {
        Handler(Looper.getMainLooper()).post {
            try {
                val tone = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 70)
                tone.startTone(if (success) ToneGenerator.TONE_PROP_ACK else ToneGenerator.TONE_PROP_NACK, 120)
                Handler(Looper.getMainLooper()).postDelayed({ tone.release() }, 200)
            } catch (_: RuntimeException) { /* A muted or unavailable audio device must not interrupt a scan. */ }
        }
    }
}
class ScanFeedbackPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(ScanFeedbackModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

