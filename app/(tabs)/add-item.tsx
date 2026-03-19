import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { decode } from "base64-arraybuffer";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
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
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { STRINGS } from "@/constants/strings";
import { RTL } from "@/constants/theme";
import { type ItemStatus } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const SLATE_800 = "#1e293b";
const SLATE_700 = "#334155";
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

function formatDateDisplay(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateToPayload(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();
  const editingId = typeof params.id === "string" ? params.id : undefined;
  const isEditing = !!editingId;
  const [activeTab, setActiveTab] = useState<"item" | "parking">(
    params.mode === "item" ? "item" : "parking"
  );
  
  // Basic State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");
  const [actionDate, setActionDate] = useState<Date>(() => new Date());
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  
  // UI State
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
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

  const currentStatus = watch("status");

  useEffect(() => {
    if (currentStatus === "loaned" && returnDate === null) {
      setReturnDate(new Date());
    }
  }, [currentStatus, returnDate]);

  useEffect(() => {
    setActiveTab(params.mode === "item" ? "item" : "parking");
  }, [params.mode]);

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
            borrowerName: ((data.contact_name ?? data.borrower_name) ?? "") as string,
            borrowerPhone: ((data.contact_phone ?? data.borrower_phone) ?? "") as string,
            loanDate: "",
            expectedReturnDate: "",
            lastSeenWhere: (data.last_seen_notes ?? "") as string,
          });
          const actionDateRaw = data.action_date ?? data.loan_date;
          const returnDateRaw = data.return_date ?? data.expected_return_date;
          setActionDate(actionDateRaw ? new Date(actionDateRaw as string) : new Date());
          setReturnDate(returnDateRaw ? new Date(returnDateRaw as string) : null);
          setLocationName((data.location_name ?? "") as string);
          if (data.image_url) {
            setImageUri(data.image_url as string);
            setExistingImageUrl(data.image_url as string);
          }
        }
      } catch {
        // ignore
      }
    };
    fetchExisting();
  }, [activeTab, editingId, reset]);

  const takePhoto = async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
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

  const navigateBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/items");
    }
  };

  const proceedWithSave = async (formData?: FormData) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("שגיאה", "אנא התחבר מחדש");
        setSaving(false);
        return;
      }

      const isNewImage = imageUri && !imageUri.startsWith("http");
      let finalImageUrl: string | null = isEditing ? (existingImageUrl ?? null) : null;

      if (isNewImage) {
        const base64 = await FileSystem.readAsStringAsync(imageUri!, { encoding: FileSystem.EncodingType.Base64 });
        const suffix = activeTab === "parking" ? `parking_${Date.now()}` : Date.now();
        const filePath = `${user.id}/${suffix}.jpg`;
        const { error: uploadError } = await supabase.storage.from("item-images").upload(filePath, decode(base64), { contentType: "image/jpeg" });
        if (uploadError) {
          Alert.alert("שגיאה", uploadError.message);
          setSaving(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from("item-images").getPublicUrl(filePath);
        finalImageUrl = publicUrl;
      } else if (imageUri === null) {
        finalImageUrl = null;
      } else if (imageUri && imageUri.startsWith("http")) {
        finalImageUrl = imageUri;
      }

      if (activeTab === "parking") {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== "granted") {
          Alert.alert("הרשאה נדרשת", "נא לאפשר גישה למיקום");
          setSaving(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        const { latitude, longitude } = loc.coords;

        if (isEditing && editingId) {
          const { error } = await supabase.from("parkings").update({
            notes: parkingNotes.trim() || null,
            location_name: locationName.trim() || null,
            latitude, longitude, image_url: finalImageUrl,
          }).eq("id", editingId);
          if (error) throw error;
          Alert.alert("עודכן בהצלחה!", "", [{ text: "אישור", onPress: navigateBackSafe }]);
        } else {
          const { error } = await supabase.from("parkings").insert([{
            user_id: user.id, notes: parkingNotes.trim() || null, location_name: locationName.trim() || null,
            latitude, longitude, image_url: finalImageUrl,
          }]);
          if (error) throw error;
          navigateBackSafe();
        }
      } else {
        const data = formData!;
        const contactName = data.borrowerName?.trim() || null;
        const contactPhone = data.borrowerPhone?.trim() || null;
        const payload: Record<string, unknown> = {
          name: data.name.trim(), description: data.description?.trim() || null, category: data.category || null,
          location_name: locationName.trim() || null, status: data.status, image_url: finalImageUrl,
          contact_name: contactName, contact_phone: contactPhone, action_date: formatDateToPayload(actionDate),
          return_date: returnDate ? formatDateToPayload(returnDate) : null,
        };
        if (!isEditing) payload.user_id = user.id;
        if (data.status === "loaned" && contactName) payload.borrower_name = contactName;
        if (data.status === "lost" && data.lastSeenWhere?.trim()) payload.last_seen_notes = data.lastSeenWhere.trim();

        if (isEditing && editingId) {
          const { error } = await supabase.from("items").update(payload).eq("id", editingId);
          if (error) throw error;
          Alert.alert("עודכן בהצלחה!", "", [{ text: "אישור", onPress: navigateBackSafe }]);
        } else {
          const { error } = await supabase.from("items").insert([payload]);
          if (error) throw error;
          setLastSavedItem({ name: data.name.trim(), description: data.description?.trim(), location: locationName.trim(), savedAt: new Date().toLocaleString("he-IL") });
          setSuccessModalVisible(true);
        }
      }
    } catch (e) {
      Alert.alert("שגיאה", e instanceof Error ? e.message : "לא ניתן לשמור. נסה שוב.");
    } finally {
      setSaving(false);
    }
  };

  const handleMainButtonPress = () => {
    if (activeTab === "item") {
      handleSubmit((data) => {
        if (data.status === "loaned" && (!data.borrowerName?.trim() || !data.borrowerPhone?.trim() || returnDate === null)) {
          requestAnimationFrame(() => {
            Alert.alert("חסרים פרטי השאלה", "לשמור בכל זאת?", [
              { text: "ביטול", style: "cancel" },
              { text: "שמור", onPress: () => proceedWithSave(data) }
            ]);
          });
          return;
        }
        proceedWithSave(data);
      })();
    } else {
      proceedWithSave();
    }
  };

  const closeSuccessAndGoToItems = () => {
    setSuccessModalVisible(false);
    requestAnimationFrame(() => { navigateBackSafe(); });
  };

  const shareToWhatsApp = () => {
    if (!lastSavedItem) return;
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(getWhatsAppShareMessage(lastSavedItem))}`);
    closeSuccessAndGoToItems();
  };

  const copyDetails = async () => {
    if (!lastSavedItem) return;
    await Clipboard.setStringAsync(getWhatsAppShareMessage(lastSavedItem));
    closeSuccessAndGoToItems();
  };

  // סגנון בטוח ואחיד לכל השדות שמונע קריסות
  const safeInputStyle = {
    backgroundColor: isDark ? SLATE_800 : "#ffffff",
    color: isDark ? "#ffffff" : "#0f172a"
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {!isEditing && (
            <View className="bg-white dark:bg-slate-800 shadow-sm" style={styles.tabToggle}>
              <TouchableOpacity style={[styles.tabBtn, activeTab === "parking" && styles.tabBtnActive]} onPress={() => setActiveTab("parking")}>
                <Text style={[styles.tabBtnText, activeTab === "parking" ? styles.tabBtnTextActive : { color: SLATE_400 }]}>חניה</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, activeTab === "item" && styles.tabBtnActive]} onPress={() => setActiveTab("item")}>
                <Text style={[styles.tabBtnText, activeTab === "item" ? styles.tabBtnTextActive : { color: SLATE_400 }]}>פריט</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.photoSection}>
            <View className="flex-row justify-center items-center gap-4 mb-6 w-full">
              <TouchableOpacity className="flex-1 items-center justify-center bg-white dark:bg-slate-800 py-6 rounded-2xl shadow-sm" onPress={takePhoto}>
                <Ionicons name="camera" size={36} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-blue-600 mt-2 text-center">{STRINGS.takePhoto}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 items-center justify-center bg-white dark:bg-slate-800 py-6 rounded-2xl shadow-sm" onPress={pickImage}>
                <Ionicons name="image" size={36} color={isDark ? "#60a5fa" : "#2563eb"} />
                <Text className="text-blue-600 mt-2 text-center">{STRINGS.uploadPhoto}</Text>
              </TouchableOpacity>
            </View>
            {imageUri && (
              <View className="bg-white dark:bg-slate-800" style={styles.photoPreview}>
                <Image source={{ uri: imageUri }} style={styles.photoThumbnail} resizeMode="cover" />
                <Pressable style={styles.photoRemoveBtn} onPress={() => setImageUri(null)} hitSlop={12}>
                  <Ionicons name="close-circle" size={36} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text className="text-slate-900 dark:text-white" style={styles.label}>{STRINGS.location}</Text>
            <View className="bg-white dark:bg-slate-800 shadow-sm" style={styles.locationInputWrap}>
              <Pressable style={styles.locationGpsBtn} onPress={fetchCurrentLocation}>
                <Ionicons name="locate" size={22} color="#fff" />
              </Pressable>
              <TextInput
                className="text-slate-900 dark:text-white"
                style={[styles.locationInput, RTL.input]}
                placeholder={activeTab === "parking" ? "מיקום החניה..." : STRINGS.savedLocations}
                placeholderTextColor={SLATE_400}
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>
          </View>

          {activeTab === "item" && (
            <>
              <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text className="text-slate-900 dark:text-white" style={styles.label}>{STRINGS.nameRequired}</Text>
                  <TextInput 
                    style={[styles.input, RTL.input, safeInputStyle, errors.name && styles.inputError]} 
                    placeholder="שם הפריט..." 
                    placeholderTextColor={SLATE_400} 
                    value={value} 
                    onChangeText={onChange} 
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>
              )} />

              <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text className="text-slate-900 dark:text-white" style={styles.label}>{STRINGS.description}</Text>
                  <TextInput 
                    style={[styles.input, styles.inputMultiline, RTL.input, safeInputStyle]} 
                    placeholder={STRINGS.description} 
                    placeholderTextColor={SLATE_400} 
                    value={value} 
                    onChangeText={onChange} 
                    multiline 
                    numberOfLines={3} 
                  />
                </View>
              )} />

              <View style={styles.field}>
                <Text className="text-slate-900 dark:text-white" style={styles.label}>{STRINGS.status}</Text>
                <View style={styles.chipRow}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isActive = currentStatus === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.8}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive ? BLUE_500 : isDark ? SLATE_800 : "#ffffff",
                            shadowColor: "#000",
                            shadowOpacity: isActive ? 0 : 0.05,
                            shadowRadius: 3,
                            elevation: isActive ? 0 : 2,
                          }
                        ]}
                        onPress={() => {
                          setTimeout(() => setValue("status", opt.id), 0);
                        }}
                      >
                        <Text style={[styles.chipText, { color: isActive ? "#ffffff" : isDark ? "#ffffff" : "#0f172a" }]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Status: Loaned */}
              {currentStatus === "loaned" && (
                <View style={styles.conditionalSection}>
                  <Controller control={control} name="borrowerName" render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={[styles.label, { color: isDark ? "#ffffff" : "#0f172a" }]}>שם השואל</Text>
                      <TextInput 
                        style={[styles.input, RTL.input, safeInputStyle]} 
                        placeholder="שם" 
                        placeholderTextColor={SLATE_400} 
                        value={value} 
                        onChangeText={onChange} 
                      />
                    </View>
                  )} />
                  <Controller control={control} name="borrowerPhone" render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={[styles.label, { color: isDark ? "#ffffff" : "#0f172a" }]}>טלפון</Text>
                      <TextInput 
                        style={[styles.input, RTL.input, safeInputStyle]} 
                        placeholder="טלפון" 
                        placeholderTextColor={SLATE_400} 
                        value={value} 
                        onChangeText={onChange} 
                        keyboardType="phone-pad" 
                      />
                    </View>
                  )} />
                </View>
              )}

              {/* Status: Sold */}
              {currentStatus === "sold" && (
                <View style={styles.conditionalSection}>
                  <Controller control={control} name="borrowerName" render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={[styles.label, { color: isDark ? "#ffffff" : "#0f172a" }]}>למי נמסר?</Text>
                      <TextInput 
                        style={[styles.input, RTL.input, safeInputStyle]} 
                        placeholder="שם" 
                        placeholderTextColor={SLATE_400} 
                        value={value} 
                        onChangeText={onChange} 
                      />
                    </View>
                  )} />
                </View>
              )}

              {/* Status: Lost */}
              {currentStatus === "lost" && (
                <View style={styles.conditionalSection}>
                  <Controller control={control} name="lastSeenWhere" render={({ field: { onChange, value } }) => (
                    <View style={styles.field}>
                      <Text style={[styles.label, { color: isDark ? "#ffffff" : "#0f172a" }]}>איפה נראה לאחרונה?</Text>
                      <TextInput 
                        style={[styles.input, styles.inputMultiline, RTL.input, safeInputStyle]} 
                        placeholder={STRINGS.lastSeenWhere} 
                        placeholderTextColor={SLATE_400} 
                        value={value} 
                        onChangeText={onChange} 
                        multiline 
                        numberOfLines={3} 
                        textAlignVertical="top" 
                      />
                    </View>
                  )} />
                </View>
              )}
            </>
          )}

          {activeTab === "parking" && (
            <View style={styles.field}>
              <Text className="text-slate-900 dark:text-white" style={styles.label}>הערות</Text>
              <TextInput style={[styles.input, styles.inputMultiline, RTL.input, safeInputStyle]} placeholder="קומה, עמוד..." placeholderTextColor={SLATE_400} value={parkingNotes} onChangeText={setParkingNotes} multiline numberOfLines={3} />
            </View>
          )}
        </ScrollView>

        <View className="w-full px-5 pt-4 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800" style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
          <TouchableOpacity onPress={handleMainButtonPress} disabled={isSubmitting || saving} className="w-full bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center">
            {isSubmitting || saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">שמור</Text>}
          </TouchableOpacity>
        </View>

        {successModalVisible && (
          <Modal visible transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View className="bg-white dark:bg-slate-800" style={styles.modalBox}>
                <Text className="text-slate-900 dark:text-white text-center" style={styles.modalTitle}>{STRINGS.success}</Text>
                <TouchableOpacity style={styles.modalBtn} onPress={copyDetails}><Text style={styles.modalBtnText}>{STRINGS.copyDetails}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalBtn} onPress={shareToWhatsApp}><Text style={styles.modalBtnText}>{STRINGS.shareToWhatsApp}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeSuccessAndGoToItems}><Text className="text-slate-500">{STRINGS.cancel}</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabToggle: { flexDirection: "row-reverse", borderRadius: 16, padding: 4, marginBottom: 24 },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  tabBtnActive: { backgroundColor: BLUE_500 },
  tabBtnText: { fontSize: 16, fontWeight: "600" },
  tabBtnTextActive: { color: "#fff" },
  photoSection: { marginBottom: 24 },
  photoPreview: { marginTop: 16, borderRadius: 12, overflow: "hidden" },
  photoThumbnail: { width: "100%", height: 200 },
  photoRemoveBtn: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 18 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, textAlign: "right" },
  input: { borderRadius: 12, padding: 16, fontSize: 16 },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  inputError: { borderWidth: 1, borderColor: "#ef4444" },
  errorText: { color: "#ef4444", fontSize: 12, marginTop: 4, textAlign: "right" },
  chipRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  chipActive: { backgroundColor: BLUE_500 },
  chipText: { fontSize: 14 },
  chipTextActive: { color: "#fff" },
  locationInputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingLeft: 14, paddingRight: 12, paddingVertical: 6 },
  locationInput: { flex: 1, fontSize: 16, paddingVertical: 12, paddingHorizontal: 10 },
  locationGpsBtn: { backgroundColor: BLUE_600, padding: 10, borderRadius: 12, marginRight: 8 },
  conditionalSection: { backgroundColor: "rgba(59, 130, 246, 0.08)", borderRadius: 12, padding: 16, marginBottom: 20 },
  conditionalTitle: { fontSize: 15, fontWeight: "600", marginBottom: 12, textAlign: "right" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 },
  modalBox: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  modalBtn: { backgroundColor: BLUE_500, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  modalBtnText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  modalBtnSecondary: { paddingVertical: 14, alignItems: "center" },
  dateTouchable: { borderRadius: 16 },
  dateTouchableText: { fontSize: 16, textAlign: "right" },
});