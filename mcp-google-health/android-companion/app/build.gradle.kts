plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.syntheticuser.healthbridge"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.syntheticuser.healthbridge"
        // Health Connect's Jetpack client supports API 26+ via the Health Connect app
        // (Play Store) on Android 9-13, and natively from Android 14 (API 34).
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.activity:activity-ktx:1.9.1")

    // Health Connect
    implementation("androidx.health.connect:connect-client:1.1.0")

    // Coroutines, for bridging Health Connect's suspend APIs into the HTTP server thread.
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Tiny embedded HTTP server so the phone can serve local health data over LAN/USB.
    implementation("org.nanohttpd:nanohttpd:2.3.1")
}
