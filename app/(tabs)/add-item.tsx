import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { decode } from "base64-arraybuffer";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useEffect, useLayoutEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { STRINGS } from "@/constants/strings";
import { Colors, RTL } from "@/constants/theme";
import { type ItemStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const BLUE_500 = "#3b82f6";
const BLUE_600 = "#2563eb";


const CATEGORIES = [
  { id: "clothes", label: STRINGS.clothes },
  { id: "electronics", label: STRINGS.electronics },
  { id: "documents", label: STRINGS.documents },
  { id: "tools", label: STRINGS.tools },
  { id: "books", label: STRINGS.books },
  { id: "other", label: STRINGS.other },
] as const;

const STATUS_OPTIONS: { id: ItemStatus; label: string }[] = [
  { id: "owned", label: STRINGS.owned },
  { id: "loaned", label: STRINGS.loaned },
  { id: "sold", label: STRINGS.sold },
  { id: "lost", label: STRINGS.lost },
];

const schema = z.object({
  name: z.string().min(1, "שדה חובה"),
  description: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["owned", "loaned", "sold", "lost"]),
  borrowerName: z.string().optional(),
  borrowerPhone: z.string().optional(),
  loanDate: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  lastSeenWhere: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PLACEHOLDER_APP_LINK = "[Placeholder for Future App Link]";

function getWhatsAppShareMessage(shared: {
  name: string;
  description?: string;
  location?: string;
  savedAt: string;
}): string {
  const lines = [
    "היי! אני משתף איתך פריט ששמרתי באפליקציית 'איפה זה?':",
    `📌 שם הפריט: ${shared.name}`,
    `📝 תיאור: ${shared.description ?? "—"}`,
    `📍 מיקום: ${shared.location ?? "—"}`,
    `🕒 זמן שמירה: ${shared.savedAt}`,
    "",
    `לפרטים נוספים: ${PLACEHOLDER_APP_LINK}`,
  ];
  return lines.join("\n");
}

const SLATE_400 = "#94a3b8";

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();
  const editingId = typeof params.id === "string" ? params.id : undefined;
  const isEditing = !!editingId;
  const [activeTab, setActiveTab] = useState<"item" | "parking">(
    params.mode === "item" ? "item" : "parking"
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [lastSavedItem, setLastSavedItem] = useState<{
    name: string;
    description?: string;
    location?: string;
    savedAt: string;
  } | null>(null);
  

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      status: "owned",
      borrowerName: "",
      borrowerPhone: "",
      loanDate: "",
      expectedReturnDate: "",
      lastSeenWhere: "",
    },
  });

  const status = watch("status");

  const navigation = useNavigation();

  useEffect(() => {
    setActiveTab(params.mode === "item" ? "item" : "parking");
  }, [params.mode]);

  useEffect(() => {
    if (!editingId) setExistingImageUrl(null);
  }, [editingId]);

  useLayoutEffect(() => {
    const title =
      activeTab === "item"
        ? isEditing
          ? "עריכת פריט"
          : "הוסף פריט"
        : isEditing
          ? "עריכת חניה"
          : "הוסף חניה";
    navigation.setOptions({ title });
  }, [navigation, activeTab, isEditing]);

  const fetchCurrentLocation = async () => {
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const a = geocode[0];
        const parts = [a.street, a.city].filter(Boolean);
        setLocationName(parts.length > 0 ? parts.join(", ") : "");
      }
    } catch {
      // Silently fail – user can type manually
    }
  };

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // If editing, fetch existing record and populate form/state
  useEffect(() => {
    const fetchExisting = async () => {
      if (!editingId) return;
      try {
        if (activeTab === "parking") {
          const { data, error } = await supabase
            .from("parkings")
            .select("*")
            .eq("id", editingId)
            .single();
          if (error || !data) return;
          setParkingNotes((data.notes ?? "") as string);
          setLocationName((data.location_name ?? "") as string);
          if (data.image_url) {
            setImageUri(data.image_url as string);
            setExistingImageUrl(data.image_url as string);
          }
        } else {
          const { data, error } = await supabase
            .from("items")
            .select("*")
            .eq("id", editingId)
            .single();
          if (error || !data) return;
          reset({
            name: (data.name ?? "") as string,
            description: (data.description ?? "") as string,
            category: (data.category ?? "") as string,
            status: (data.status as ItemStatus) ?? "owned",
            borrowerName: (data.borrower_name ?? "") as string,
            lastSeenWhere: (data.last_seen_notes ?? "") as string,
          });
          setLocationName((data.location_name ?? "") as string);
          if (data.image_url) {
            setImageUri(data.image_url as string);
            setExistingImageUrl(data.image_url as string);
          }
        }
      } catch {
        // ignore – stay in empty state
      }
    };

    fetchExisting();
  }, [activeTab, editingId, reset]);

  const takePhoto = async () => {
    const { status: perm } =
      await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== "granted") {
      Alert.alert("הרשאה נדרשת", "נא לאפשר גישה למצלמה");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      fetchCurrentLocation();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      fetchCurrentLocation();
    }
  };

  const handleSave = async (formData?: FormData) => {
    if (activeTab === "item") {
      if (!formData?.name?.trim()) {
        Alert.alert("שגיאה", "נא להזין שם לפריט");
        return;
      }
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("שגיאה", "אנא התחבר מחדש");
        return;
      }

      const isNewImage = imageUri && !imageUri.startsWith("http");
      let finalImageUrl: string | null = isEditing ? (existingImageUrl ?? null) : null;

      if (isNewImage) {
        const base64 = await FileSystem.readAsStringAsync(imageUri!, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const suffix = activeTab === "parking" ? `parking_${Date.now()}` : Date.now();
        const filePath = `${user.id}/${suffix}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, decode(base64), { contentType: "image/jpeg" });

        if (uploadError) {
          Alert.alert("שגיאה", uploadError.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("item-images").getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      } else if (imageUri === null) {
        finalImageUrl = null;
      } else if (imageUri && imageUri.startsWith("http")) {
        finalImageUrl = imageUri;
      }

      if (activeTab === "parking") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("הרשאה נדרשת", "נא לאפשר גישה למיקום");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        const { latitude, longitude } = loc.coords;

        if (isEditing && editingId) {
          const payload: Record<string, unknown> = {
            notes: parkingNotes.trim() || null,
            location_name: locationName.trim() || null,
            latitude,
            longitude,
            image_url: finalImageUrl,
          };
          const { error } = await supabase
            .from("parkings")
            .update(payload)
            .eq("id", editingId);
          if (error) {
            Alert.alert("שגיאה", error.message);
            return;
          }
          Alert.alert("עודכן בהצלחה!");
          router.replace("/(tabs)/parking");
        } else {
          const { error } = await supabase.from("parkings").insert([
            {
              user_id: user.id,
              notes: parkingNotes.trim() || null,
              location_name: locationName.trim() || null,
              latitude,
              longitude,
              image_url: finalImageUrl,
            },
          ]);

          if (error) {
            Alert.alert("שגיאה", error.message);
            return;
          }

          setParkingNotes("");
          setLocationName("");
          setImageUri(null);
          fetchCurrentLocation();
          router.replace("/(tabs)/parking");
        }
      } else {
        const data = formData!;
        const payload: Record<string, unknown> = {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          category: data.category || null,
          location_name: locationName.trim() || null,
          status: data.status,
          image_url: finalImageUrl,
        };
        if (!isEditing) {
          payload.user_id = user.id;
        }
        if (data.status === "loaned" && data.borrowerName?.trim()) {
          payload.borrower_name = data.borrowerName.trim();
        }
        if (data.status === "lost" && data.lastSeenWhere?.trim()) {
          payload.last_seen_notes = data.lastSeenWhere.trim();
        }

        if (isEditing && editingId) {
          const { error } = await supabase
            .from("items")
            .update(payload)
            .eq("id", editingId);

          if (error) {
            Alert.alert("שגיאה", error.message);
            return;
          }

          Alert.alert("עודכן בהצלחה!");
          router.replace("/(tabs)/items");
        } else {
          const { error } = await supabase.from("items").insert([payload]);

          if (error) {
            Alert.alert("שגיאה", error.message);
            return;
          }

          const savedAt = new Date().toLocaleString("he-IL", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          setLastSavedItem({
            name: data.name.trim(),
            description: data.description?.trim(),
            location: locationName.trim(),
            savedAt,
          });
          reset(defaultFormValues);
          setImageUri(null);
          setLocationName("");
          setSuccessModalVisible(true);
        }
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "לא ניתן לשמור. נסה שוב.";
      Alert.alert("שגיאה", message);
    } finally {
      setSaving(false);
    }
  };

  const defaultFormValues = {
    name: "",
    description: "",
    category: "",
    location: "",
    status: "owned" as const,
    borrowerName: "",
    borrowerPhone: "",
    loanDate: "",
    expectedReturnDate: "",
    lastSeenWhere: "",
  };

  const closeSuccessAndGoToItems = () => {
    reset(defaultFormValues);
    setImageUri(null);
    setSuccessModalVisible(false);
    router.push("/(tabs)/items");
  };

  const shareToWhatsApp = () => {
    if (!lastSavedItem) return;
    const msg = getWhatsAppShareMessage(lastSavedItem);
    const encoded = encodeURIComponent(msg);
    Linking.openURL(`https://wa.me/?text=${encoded}`);
    closeSuccessAndGoToItems();
  };

  const copyDetails = async () => {
    if (!lastSavedItem) return;
    const msg = getWhatsAppShareMessage(lastSavedItem);
    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard
    ) {
      await navigator.clipboard.writeText(msg);
    } else {
      await Clipboard.setStringAsync(msg);
    }
    closeSuccessAndGoToItems();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.dark.background }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 40,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Top Toggle: פריט | חניה (hidden in edit mode) */}
        {!isEditing && (
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "parking" && styles.tabBtnActive]}
            onPress={() => setActiveTab("parking")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "parking" && styles.tabBtnTextActive,
                RTL.text,
              ]}
            >
              חניה
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "item" && styles.tabBtnActive]}
            onPress={() => setActiveTab("item")}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === "item" && styles.tabBtnTextActive,
                RTL.text,
              ]}
            >
              פריט
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Shared: Photo section */}
        <View style={styles.photoSection}>
          <View style={styles.photoActions}>
            <Pressable
              style={({ pressed }) => [
                styles.photoBtn,
                pressed && styles.photoBtnPressed,
              ]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={36} color={Colors.dark.primary} />
              <Text style={[styles.photoBtnLabel, RTL.text]}>
                {STRINGS.takePhoto}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.photoBtn,
                pressed && styles.photoBtnPressed,
              ]}
              onPress={pickImage}
            >
              <Ionicons name="image" size={36} color={Colors.dark.primary} />
              <Text style={[styles.photoBtnLabel, RTL.text]}>
                {STRINGS.uploadPhoto}
              </Text>
            </Pressable>
          </View>
          {imageUri ? (
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: imageUri }}
                style={styles.photoThumbnail}
                resizeMode="cover"
              />
              <Pressable
                style={styles.photoRemoveBtn}
                onPress={() => setImageUri(null)}
                hitSlop={12}
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Shared: Location Input (auto-fetched) */}
        <View style={styles.field}>
          <Text style={[styles.label, RTL.text]}>{STRINGS.location}</Text>
          <View style={styles.locationInputWrap}>
            <Pressable
              style={styles.locationGpsBtn}
              onPress={fetchCurrentLocation}
            >
              <Ionicons name="locate" size={22} color="#fff" />
            </Pressable>
            <TextInput
              style={[styles.locationInput, RTL.input]}
              placeholder={
                activeTab === "parking"
                  ? "מיקום החניה (כתובת/GPS)"
                  : `${STRINGS.savedLocations} / ${STRINGS.currentGPS}`
              }
              placeholderTextColor={Colors.dark.muted}
              value={locationName}
              onChangeText={setLocationName}
            />
          </View>
        </View>

        {/* Item-specific fields */}
        {activeTab === "item" && (
        <>
      {/* Name (required) */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.field}>
            <Text style={[styles.label, RTL.text]}>{STRINGS.nameRequired}</Text>
            <TextInput
              style={[
                styles.input,
                errors.name && styles.inputError,
              ]}
              placeholder="שם הפריט..."
              placeholderTextColor={Colors.dark.muted}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              {...RTL.input}
            />
            {errors.name ? (
              <Text style={[styles.errorText, RTL.text]}>
                {errors.name.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {/* Description (multiline, min 3 lines) */}
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.field}>
            <Text style={[styles.label, RTL.text]}>{STRINGS.description}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder={STRINGS.description}
              placeholderTextColor={Colors.dark.muted}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              {...RTL.input}
            />
          </View>
        )}
      />

      {/* Category chips (optional; tap active chip to deselect) */}
      <View style={styles.field}>
        <Text style={[styles.label, RTL.text]}>{STRINGS.category}</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Controller
              key={cat.id}
              control={control}
              name="category"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  style={[
                    styles.chip,
                    value === cat.id ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => onChange(value === cat.id ? "" : cat.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      value === cat.id && styles.chipTextActive,
                      RTL.text,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              )}
            />
          ))}
        </View>
      </View>

      {/* Status chips (default בבעלותי) */}
      <View style={styles.field}>
        <Text style={[styles.label, RTL.text]}>{STRINGS.status}</Text>
        <View style={styles.chipRow}>
          {STATUS_OPTIONS.map((opt) => (
            <Controller
              key={opt.id}
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  style={[
                    styles.chip,
                    value === opt.id ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => onChange(opt.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      value === opt.id && styles.chipTextActive,
                      RTL.text,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              )}
            />
          ))}
        </View>
      </View>

      {/* If status === loaned: למי הושאל? + תאריך השאלה */}
      {status === "loaned" && (
        <View style={styles.conditionalSection}>
          <Text style={[styles.conditionalTitle, RTL.text]}>הושאל</Text>
          <Controller
            control={control}
            name="borrowerName"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={[styles.label, RTL.text]}>למי הושאל?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="שם השואל"
                  placeholderTextColor={Colors.dark.muted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  {...RTL.input}
                />
              </View>
            )}
          />
          <Controller
            control={control}
            name="loanDate"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={[styles.label, RTL.text]}>
                  {STRINGS.loanDate}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.dark.muted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  {...RTL.input}
                />
              </View>
            )}
          />
        </View>
      )}

      {/* If status === lost: איפה נראה לאחרונה? */}
      {status === "lost" && (
        <View style={styles.conditionalSection}>
          <Controller
            control={control}
            name="lastSeenWhere"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={[styles.label, RTL.text]}>
                  איפה נראה לאחרונה?
                </Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder={STRINGS.lastSeenWhere}
                  placeholderTextColor={Colors.dark.muted}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  {...RTL.input}
                />
              </View>
            )}
          />
        </View>
      )}
        </>
        )}

        {/* Parking-specific: Notes */}
        {activeTab === "parking" && (
          <View style={styles.field}>
            <Text style={[styles.label, RTL.text]}>הערות</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, RTL.input]}
              placeholder="הערות (קומה, עמוד...)"
              placeholderTextColor={Colors.dark.muted}
              value={parkingNotes}
              onChangeText={setParkingNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* Sticky Save button – fixed at bottom, inside KeyboardAvoidingView */}
      <View
        className="w-full px-5 pt-4 bg-slate-900 border-t border-slate-800"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}
      >
        <TouchableOpacity
          onPress={
            activeTab === "item"
              ? handleSubmit(handleSave)
              : () => handleSave()
          }
          disabled={isSubmitting || saving}
          className="w-full bg-blue-600 rounded-2xl py-4 flex flex-row items-center justify-center"
          activeOpacity={0.9}
        >
          {isSubmitting || saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg text-center">
              {activeTab === "item"
                ? isEditing
                  ? "עדכן פריט"
                  : "שמור פריט"
                : isEditing
                  ? "עדכן חניה"
                  : "שמור חניה"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
      >
        <Pressable style={styles.modalOverlay} onPress={closeSuccessAndGoToItems}>
          <Pressable
            style={styles.modalBox}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, RTL.text]}>{STRINGS.success}</Text>
            <Pressable style={styles.modalBtn} onPress={copyDetails}>
              <Text style={[styles.modalBtnText, RTL.text]}>
                {STRINGS.copyDetails}
              </Text>
            </Pressable>
            <Pressable style={styles.modalBtn} onPress={shareToWhatsApp}>
              <Text style={[styles.modalBtnText, RTL.text]}>
                {STRINGS.shareToWhatsApp}
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalBtnSecondary}
              onPress={closeSuccessAndGoToItems}
            >
              <Text style={[styles.modalBtnTextSecondary, RTL.text]}>
                {STRINGS.cancel}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: { paddingHorizontal: 20 },
  tabToggle: {
    flexDirection: "row-reverse",
    backgroundColor: SLATE_800,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    marginHorizontal: 0,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: BLUE_500,
  },
  tabBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: SLATE_400,
  },
  tabBtnTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  photoSection: {
    marginBottom: 24,
  },
  photoActions: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: SLATE_800,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtnPressed: { opacity: 0.9 },
  photoBtnLabel: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.dark.primary,
    fontWeight: "600",
  },
  photoPreview: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: SLATE_800,
    position: "relative",
  },
  photoThumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  photoRemoveBtn: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 18,
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: SLATE_800,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  inputError: { borderWidth: 1, borderColor: "#ef4444" },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipInactive: {
    backgroundColor: SLATE_800,
  },
  chipActive: {
    backgroundColor: BLUE_500,
  },
  chipText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  chipTextActive: { color: "#fff" },
  locationInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SLATE_800,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 6,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  locationGpsBtn: {
    backgroundColor: BLUE_600,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  conditionalSection: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  conditionalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.dark.card,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  modalBtnSecondary: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalBtnTextSecondary: { color: Colors.dark.muted, fontSize: 16 },
});
