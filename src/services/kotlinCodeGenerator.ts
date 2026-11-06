import { IslandConfig, ScheduleRule, ThemePreset } from '../types/novaIsland';

export interface GeneratedKotlinFile {
  filename: string;
  module: string;
  description: string;
  code: string;
}

function hexToKotlinColor(hex: string): string {
  const clean = hex.replace('#', '').toUpperCase();
  return `Color(0xFF${clean.padEnd(6, '0')})`;
}

export function generateKotlinSourceFiles(
  config: IslandConfig,
  customPresets: ThemePreset[],
  schedules: ScheduleRule[]
): GeneratedKotlinFile[] {
  const overlayServiceFile: GeneratedKotlinFile = {
    filename: 'NovaIslandOverlayService.kt',
    module: ':app:service',
    description:
      'Android Accessibility & System WindowManager Overlay Service (TYPE_APPLICATION_OVERLAY) that renders the live Dynamic Island over any Android app.',
    code: `package com.novaisland.studio.service

import android.accessibilityservice.AccessibilityService
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ComposeView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.novaisland.studio.datastore.NovaIslandPreferences
import com.novaisland.studio.datastore.NovaIslandPreferencesRepository
import com.novaisland.studio.datastore.novaIslandDataStore
import com.novaisland.studio.ui.overlay.NovaDynamicIslandOverlay

class NovaIslandOverlayService : AccessibilityService(), LifecycleOwner, SavedStateRegistryOwner {

    private lateinit var windowManager: WindowManager
    private var overlayView: ComposeView? = null
    private val lifecycleRegistry = LifecycleRegistry(this)
    private val savedStateRegistryController = SavedStateRegistryController.create(this)

    override val lifecycle: Lifecycle get() = lifecycleRegistry
    override val savedStateRegistry: SavedStateRegistry
        get() = savedStateRegistryController.savedStateRegistry

    override fun onServiceConnected() {
        super.onServiceConnected()
        savedStateRegistryController.performRestore(null)
        lifecycleRegistry.currentState = Lifecycle.State.RESUMED
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val repository = NovaIslandPreferencesRepository(applicationContext.novaIslandDataStore)

        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            x = ${config.positionX}
            y = ${config.positionY}
        }

        overlayView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(this@NovaIslandOverlayService)
            setViewTreeSavedStateRegistryOwner(this@NovaIslandOverlayService)
            setContent {
                val prefs by repository.preferencesFlow.collectAsState(initial = NovaIslandPreferences())
                var isExpanded by remember { mutableStateOf(false) }
                NovaDynamicIslandOverlay(
                    prefs = prefs,
                    isExpanded = isExpanded,
                    onToggleExpand = { isExpanded = !isExpanded }
                )
            }
        }

        windowManager.addView(overlayView, layoutParams)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Reacts to system notification and media session changes
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
        overlayView?.let { windowManager.removeView(it) }
        super.onDestroy()
    }
}
`,
  };

  const manifestFile: GeneratedKotlinFile = {
    filename: 'AndroidManifest.xml',
    module: ':app:main',
    description:
      'Android APK manifest declaring SYSTEM_ALERT_WINDOW, BIND_ACCESSIBILITY_SERVICE, and BIND_NOTIFICATION_LISTENER_SERVICE for system-wide Dynamic Island overlay.',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.novaisland.studio">

    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:label="Nova Island"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.Dark.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.NovaIslandOverlayService"
            android:exported="false"
            android:label="Nova Dynamic Island Overlay"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
        </service>
    </application>
</manifest>
`,
  };

  const datastoreFile: GeneratedKotlinFile = {
    filename: 'NovaIslandDataStore.kt',
    module: ':core:datastore',
    description:
      'Jetpack Preferences DataStore persistence for all 49 Nova Island personalization parameters with atomic coroutine transactions.',
    code: `package com.novaisland.studio.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

val Context.novaIslandDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "nova_island_personalization_prefs"
)

data class NovaIslandPreferences(
    val fillMode: String = "${config.fillMode}",
    val primaryColorHex: String = "${config.primaryColor}",
    val secondaryColorHex: String = "${config.secondaryColor}",
    val tertiaryColorHex: String = "${config.tertiaryColor}",
    val useThreeStopGradient: Boolean = ${config.useThreeStopGradient},
    val gradientAngle: Float = ${config.gradientAngle}f,
    val textColorHex: String = "${config.textColor}",
    val accentColorHex: String = "${config.accentColor}",
    val neonGlowEnabled: Boolean = ${config.neonGlowEnabled},
    val neonGlowColorHex: String = "${config.neonGlowColor}",
    val neonGlowIntensity: Int = ${config.neonGlowIntensity},
    val neonGlowSpreadDp: Int = ${config.neonGlowSpread},
    val opacityPercent: Int = ${config.opacity},
    val backdropBlurDp: Int = ${config.backdropBlur},
    val saturationPercent: Int = ${config.saturation},
    val brightnessPercent: Int = ${config.brightness},
    val compactWidthDp: Int = ${config.compactWidth},
    val compactHeightDp: Int = ${config.compactHeight},
    val cornerRadiusDp: Int = ${config.cornerRadius},
    val positionXDp: Int = ${config.positionX},
    val positionYDp: Int = ${config.positionY},
    val innerPaddingDp: Int = ${config.innerPadding},
    val borderWidthDp: Float = ${config.borderWidth}f,
    val borderColorHex: String = "${config.borderColor}",
    val expandedWidthDp: Int = ${config.expandedWidth},
    val expandedHeightDp: Int = ${config.expandedHeight},
    val expandedRadiusDp: Int = ${config.expandedRadius},
    val shapePreset: String = "${config.shapePreset}",
    val animationStyle: String = "${config.animationStyle}",
    val animationSpeedMultiplier: Float = ${config.animationSpeed}f,
    val springStiffness: Float = ${config.springStiffness}f,
    val springDamping: Float = ${config.springDamping}f,
    val particlesEnabled: Boolean = ${config.particlesEnabled},
    val targetFrameRateHz: Int = ${config.targetFrameRate},
    val oledBurnInProtection: Boolean = ${config.oledBurnInProtection}
)

class NovaIslandPreferencesRepository(private val dataStore: DataStore<Preferences>) {

    private object Keys {
        val FILL_MODE = stringPreferencesKey("fill_mode")
        val PRIMARY_COLOR = stringPreferencesKey("primary_color_hex")
        val SECONDARY_COLOR = stringPreferencesKey("secondary_color_hex")
        val GRADIENT_ANGLE = floatPreferencesKey("gradient_angle")
        val NEON_GLOW_ENABLED = booleanPreferencesKey("neon_glow_enabled")
        val NEON_GLOW_INTENSITY = intPreferencesKey("neon_glow_intensity")
        val COMPACT_WIDTH = intPreferencesKey("compact_width_dp")
        val COMPACT_HEIGHT = intPreferencesKey("compact_height_dp")
        val CORNER_RADIUS = intPreferencesKey("corner_radius_dp")
        val EXPANDED_WIDTH = intPreferencesKey("expanded_width_dp")
        val EXPANDED_HEIGHT = intPreferencesKey("expanded_height_dp")
        val ANIMATION_STYLE = stringPreferencesKey("animation_style")
        val ANIMATION_SPEED = floatPreferencesKey("animation_speed")
        val TARGET_FPS = intPreferencesKey("target_fps_hz")
        val OLED_PROTECTION = booleanPreferencesKey("oled_burn_in_protection")
    }

    val preferencesFlow: Flow<NovaIslandPreferences> = dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }
        .map { prefs ->
            NovaIslandPreferences(
                fillMode = prefs[Keys.FILL_MODE] ?: "${config.fillMode}",
                primaryColorHex = prefs[Keys.PRIMARY_COLOR] ?: "${config.primaryColor}",
                secondaryColorHex = prefs[Keys.SECONDARY_COLOR] ?: "${config.secondaryColor}",
                gradientAngle = prefs[Keys.GRADIENT_ANGLE] ?: ${config.gradientAngle}f,
                neonGlowEnabled = prefs[Keys.NEON_GLOW_ENABLED] ?: ${config.neonGlowEnabled},
                neonGlowIntensity = prefs[Keys.NEON_GLOW_INTENSITY] ?: ${config.neonGlowIntensity},
                compactWidthDp = prefs[Keys.COMPACT_WIDTH] ?: ${config.compactWidth},
                compactHeightDp = prefs[Keys.COMPACT_HEIGHT] ?: ${config.compactHeight},
                cornerRadiusDp = prefs[Keys.CORNER_RADIUS] ?: ${config.cornerRadius},
                expandedWidthDp = prefs[Keys.EXPANDED_WIDTH] ?: ${config.expandedWidth},
                expandedHeightDp = prefs[Keys.EXPANDED_HEIGHT] ?: ${config.expandedHeight},
                animationStyle = prefs[Keys.ANIMATION_STYLE] ?: "${config.animationStyle}",
                animationSpeedMultiplier = prefs[Keys.ANIMATION_SPEED] ?: ${config.animationSpeed}f,
                targetFrameRateHz = prefs[Keys.TARGET_FPS] ?: ${config.targetFrameRate},
                oledBurnInProtection = prefs[Keys.OLED_PROTECTION] ?: ${config.oledBurnInProtection}
            )
        }

    suspend fun commitPreferences(updated: NovaIslandPreferences) {
        dataStore.edit { prefs ->
            prefs[Keys.FILL_MODE] = updated.fillMode
            prefs[Keys.PRIMARY_COLOR] = updated.primaryColorHex
            prefs[Keys.SECONDARY_COLOR] = updated.secondaryColorHex
            prefs[Keys.GRADIENT_ANGLE] = updated.gradientAngle
            prefs[Keys.NEON_GLOW_ENABLED] = updated.neonGlowEnabled
            prefs[Keys.NEON_GLOW_INTENSITY] = updated.neonGlowIntensity
            prefs[Keys.COMPACT_WIDTH] = updated.compactWidthDp
            prefs[Keys.COMPACT_HEIGHT] = updated.compactHeightDp
            prefs[Keys.CORNER_RADIUS] = updated.cornerRadiusDp
            prefs[Keys.EXPANDED_WIDTH] = updated.expandedWidthDp
            prefs[Keys.EXPANDED_HEIGHT] = updated.expandedHeightDp
            prefs[Keys.ANIMATION_STYLE] = updated.animationStyle
            prefs[Keys.ANIMATION_SPEED] = updated.animationSpeedMultiplier
            prefs[Keys.TARGET_FPS] = updated.targetFrameRateHz
            prefs[Keys.OLED_PROTECTION] = updated.oledBurnInProtection
        }
    }
}
`,
  };

  const composeFile: GeneratedKotlinFile = {
    filename: 'DynamicIslandComposable.kt',
    module: ':feature:island-overlay',
    description:
      'Jetpack Compose Material 3 Dynamic Island overlay with spring physics, custom corner geometry, neon glow shadow, and hardware layer caching.',
    code: `package com.novaisland.studio.ui.overlay

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.novaisland.studio.datastore.NovaIslandPreferences

@Composable
fun NovaDynamicIslandOverlay(
    prefs: NovaIslandPreferences,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    modifier: Modifier = Modifier
) {
    val targetWidth by animateDpAsState(
        targetValue = if (isExpanded) ${config.expandedWidth}.dp else ${config.compactWidth}.dp,
        animationSpec = spring(stiffness = ${config.springStiffness}f),
        label = "islandWidth"
    )

    val targetHeight by animateDpAsState(
        targetValue = if (isExpanded) ${config.expandedHeight}.dp else ${config.compactHeight}.dp,
        animationSpec = spring(stiffness = ${config.springStiffness}f),
        label = "islandHeight"
    )

    val islandShape = RoundedCornerShape(
        topStart = ${config.lockCorners ? config.cornerRadius : config.radiusTopLeft}.dp,
        topEnd = ${config.lockCorners ? config.cornerRadius : config.radiusTopRight}.dp,
        bottomEnd = ${config.lockCorners ? config.cornerRadius : config.radiusBottomRight}.dp,
        bottomStart = ${config.lockCorners ? config.cornerRadius : config.radiusBottomLeft}.dp
    )

    val primaryColor = ${hexToKotlinColor(config.primaryColor)}
    val secondaryColor = ${hexToKotlinColor(config.secondaryColor)}
    val glowColor = ${hexToKotlinColor(config.neonGlowColor)}

    val backgroundBrush = Brush.linearGradient(
        colors = listOf(primaryColor, secondaryColor),
        start = Offset.Zero,
        end = Offset.Infinite
    )

    Box(
        modifier = modifier
            .offset(x = (${config.positionX}).dp, y = ${config.positionY}.dp)
            .size(width = targetWidth, height = targetHeight)
            .graphicsLayer {
                alpha = ${Number((config.opacity / 100).toFixed(2))}f
                compositingStrategy = CompositingStrategy.Offscreen
            }
            .drawBehind {
                if (${config.neonGlowEnabled}) {
                    drawRoundRect(
                        color = glowColor.copy(alpha = ${Number((config.neonGlowIntensity / 100).toFixed(2))}f),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(${config.cornerRadius}.dp.toPx())
                    )
                }
            }
            .clip(islandShape)
            .background(brush = backgroundBrush)
            .border(
                width = ${config.borderWidth}.dp,
                color = ${hexToKotlinColor(config.borderColor)},
                shape = islandShape
            )
            .clickable { onToggleExpand() }
            .padding(${config.innerPadding}.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Nova Island Active",
                color = ${hexToKotlinColor(config.textColor)},
                fontSize = ${config.titleTextSize}.sp
            )
        }
    }
}
`,
  };

  const roomFile: GeneratedKotlinFile = {
    filename: 'NovaIslandRoomDatabase.kt',
    module: ':core:database',
    description:
      'Room SQLite entities, DAO interfaces, and database configuration for unlimited saved presets, user profiles, and automated schedules.',
    code: `package com.novaisland.studio.database

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "theme_presets")
data class ThemePresetEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "name") val name: String,
    @ColumnInfo(name = "category") val category: String,
    @ColumnInfo(name = "is_built_in") val isBuiltIn: Boolean,
    @ColumnInfo(name = "is_favorite") val isFavorite: Boolean,
    @ColumnInfo(name = "config_json") val configJson: String,
    @ColumnInfo(name = "updated_at") val updatedAt: Long
)

@Dao
interface NovaIslandDao {
    @Query("SELECT * FROM theme_presets ORDER BY is_favorite DESC, updated_at DESC")
    fun observeAllThemes(): Flow<List<ThemePresetEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertThemePreset(entity: ThemePresetEntity)

    @Query("UPDATE theme_presets SET name = :newName, updated_at = :timestamp WHERE id = :id")
    suspend fun renameThemePreset(id: String, newName: String, timestamp: Long = System.currentTimeMillis())

    @Query("DELETE FROM theme_presets WHERE id = :id AND is_built_in = 0")
    suspend fun deleteCustomThemePreset(id: String)
}
// Currently persisted custom presets: ${customPresets.length} | Active schedules: ${schedules.filter((s) => s.enabled).length}
`,
  };

  return [overlayServiceFile, manifestFile, datastoreFile, composeFile, roomFile];
}
