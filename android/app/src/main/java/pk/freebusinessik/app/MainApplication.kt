package pk.freebusinessik.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.soloader.OpenSourceMergedSoMapping // ✅ ADDED THIS IMPORT
import com.facebook.soloader.SoLoader
import com.microsoft.codepush.react.CodePush
import okhttp3.OkHttpClient

class MainApplication : Application(), ReactApplication {

  private val mReactNativeHost: ReactNativeHost by lazy {
    object : DefaultReactNativeHost(this) {
      override fun getUseDeveloperSupport() = BuildConfig.DEBUG

      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages.apply {
          // Manual CodePush instance (autolinking disabled for this package).
          add(
            CodePush(
              getResources().getString(R.string.CodePushDeploymentKey),
              applicationContext,
              BuildConfig.DEBUG
            )
          )
        }

      override fun getJSMainModuleName(): String = "index"

      override fun getJSBundleFile(): String {
        return CodePush.getJSBundleFile()
      }

      override val isNewArchEnabled: Boolean
        get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

      override val isHermesEnabled: Boolean?
        get() = BuildConfig.IS_HERMES_ENABLED
    }
  }

  override val reactNativeHost: ReactNativeHost
    get() = mReactNativeHost

  override fun onCreate() {
    // ✅ 1. Initialize SoLoader with the mapping (FIXES THE CRASH)
    SoLoader.init(this, OpenSourceMergedSoMapping)

    OkHttpClientProvider.setOkHttpClientFactory(object : OkHttpClientFactory {
      override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClientProvider.createClientBuilder()
          .addInterceptor { chain ->
            val request = chain.request().newBuilder()
              .header(
                "User-Agent",
                "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 FreeBusiness/2.7.5"
              )
              .header("Accept", "application/json")
              .header("X-FB-Client", "FreeBusinessMobile")
              .build()
            chain.proceed(request)
          }
          .build()
      }
    })
    
    super.onCreate()
    
    // ✅ 2. Only load New Architecture if it's actually enabled in gradle.properties
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      DefaultNewArchitectureEntryPoint.load()
    }
  }
}