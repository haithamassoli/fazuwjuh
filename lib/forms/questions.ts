// placeholder: final question list comes from the product owner.

export type Question = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect";
  options?: string[];
  group: string;
  inCard?: boolean;
  required?: boolean;
  adminOnly?: boolean;
};

const RESIDENCE_OPTIONS = [
  "عمّان",
  "إربد",
  "الزرقاء",
  "البلقاء",
  "مادبا",
  "المفرق",
  "جرش",
  "عجلون",
  "الكرك",
  "الطفيلة",
  "معان",
  "العقبة",
  "خارج الأردن",
];

const CONTACT_GROUP = "بيانات التواصل";
const BASICS_GROUP = "بيانات أساسية";
const RELIGION_GROUP = "الالتزام الديني";
const WORK_GROUP = "العمل والتعليم";
const ABOUT_MALE_GROUP = "عن المتقدم";
const ABOUT_FEMALE_GROUP = "عن المتقدمة";
const SEEKING_MALE_GROUP = "المطلوب في الشريكة";
const SEEKING_FEMALE_GROUP = "المطلوب في الشريك";

export const QUESTIONS: { male: Question[]; female: Question[] } = {
  male: [
    // --- fixed ids ---
    {
      id: "name",
      label: "الاسم الكامل",
      type: "text",
      group: CONTACT_GROUP,
      required: true,
      adminOnly: true,
    },
    {
      id: "phone",
      label: "رقم هاتف المتقدم",
      type: "text",
      group: CONTACT_GROUP,
      required: true,
      adminOnly: true,
    },
    {
      id: "age",
      label: "العمر",
      type: "number",
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "maritalStatus",
      label: "الحالة الاجتماعية",
      type: "select",
      options: ["أعزب", "متزوج", "مطلق", "أرمل"],
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "residence",
      label: "السكن",
      type: "select",
      options: RESIDENCE_OPTIONS,
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "nationality",
      label: "الجنسية",
      type: "select",
      options: ["أردنية", "فلسطينية", "سورية", "أخرى"],
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "dress",
      label: "المظهر",
      type: "select",
      options: ["بلحية", "بدون لحية"],
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    // --- بيانات أساسية إضافية ---
    {
      id: "height",
      label: "الطول (سم)",
      type: "number",
      group: BASICS_GROUP,
    },
    {
      id: "weight",
      label: "الوزن (كغم)",
      type: "number",
      group: BASICS_GROUP,
    },
    {
      id: "healthStatus",
      label: "الحالة الصحية",
      type: "text",
      group: BASICS_GROUP,
    },
    {
      id: "childrenCount",
      label: "عدد الأبناء (إن وُجد)",
      type: "number",
      group: BASICS_GROUP,
    },
    // --- الالتزام الديني ---
    {
      id: "prayerCommitment",
      label: "المحافظة على الصلاة",
      type: "select",
      options: ["في المسجد دائمًا", "غالبًا في المسجد", "في وقتها"],
      group: RELIGION_GROUP,
      required: true,
    },
    {
      id: "quranMemorization",
      label: "مقدار الحفظ من القرآن الكريم",
      type: "text",
      group: RELIGION_GROUP,
    },
    {
      id: "religiousCommitmentDesc",
      label: "وصف مختصر للالتزام الديني",
      type: "textarea",
      group: RELIGION_GROUP,
    },
    // --- العمل والتعليم ---
    {
      id: "educationLevel",
      label: "المستوى التعليمي",
      type: "select",
      options: ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"],
      group: WORK_GROUP,
      required: true,
    },
    {
      id: "fieldOfStudy",
      label: "التخصص",
      type: "text",
      group: WORK_GROUP,
    },
    {
      id: "job",
      label: "العمل الحالي",
      type: "text",
      group: WORK_GROUP,
      required: true,
    },
    {
      id: "monthlyIncome",
      label: "الدخل الشهري التقريبي",
      type: "text",
      group: WORK_GROUP,
    },
    // --- عن المتقدم ---
    {
      id: "aboutMe",
      label: "نبذة عن شخصيتي وطباعي",
      type: "textarea",
      group: ABOUT_MALE_GROUP,
      required: true,
    },
    {
      id: "familyDescription",
      label: "نبذة عن الأسرة",
      type: "textarea",
      group: ABOUT_MALE_GROUP,
    },
    // --- المطلوب في الشريكة ---
    {
      id: "seeking",
      label: "المطلوب في شريكة الحياة",
      type: "textarea",
      group: SEEKING_MALE_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "seekingAgeRange",
      label: "الفئة العمرية المطلوبة",
      type: "text",
      group: SEEKING_MALE_GROUP,
    },
  ],
  female: [
    // --- fixed ids ---
    {
      id: "name",
      label: "الاسم الكامل",
      type: "text",
      group: CONTACT_GROUP,
      required: true,
      adminOnly: true,
    },
    {
      id: "phone",
      label: "رقم هاتف ولي الأمر",
      type: "text",
      group: CONTACT_GROUP,
      required: true,
      adminOnly: true,
    },
    {
      id: "age",
      label: "العمر",
      type: "number",
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "maritalStatus",
      label: "الحالة الاجتماعية",
      type: "select",
      options: ["عزباء", "مطلقة", "أرملة"],
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "residence",
      label: "السكن",
      type: "select",
      options: RESIDENCE_OPTIONS,
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "nationality",
      label: "الجنسية",
      type: "select",
      options: ["أردنية", "فلسطينية", "سورية", "أخرى"],
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "dress",
      label: "اللباس",
      type: "select",
      options: ["منتقبة", "محجبة بجلباب", "محجبة"],
      group: BASICS_GROUP,
      required: true,
      inCard: true,
    },
    // --- بيانات أساسية إضافية ---
    {
      id: "height",
      label: "الطول (سم)",
      type: "number",
      group: BASICS_GROUP,
    },
    {
      id: "weight",
      label: "الوزن (كغم)",
      type: "number",
      group: BASICS_GROUP,
    },
    {
      id: "healthStatus",
      label: "الحالة الصحية",
      type: "text",
      group: BASICS_GROUP,
    },
    {
      id: "childrenCount",
      label: "عدد الأبناء (إن وُجد)",
      type: "number",
      group: BASICS_GROUP,
    },
    // --- الالتزام الديني ---
    {
      id: "prayerCommitment",
      label: "المحافظة على الصلاة",
      type: "select",
      options: ["محافظة دائمًا", "غالبًا محافظة", "في وقتها"],
      group: RELIGION_GROUP,
      required: true,
    },
    {
      id: "quranMemorization",
      label: "مقدار الحفظ من القرآن الكريم",
      type: "text",
      group: RELIGION_GROUP,
    },
    {
      id: "religiousCommitmentDesc",
      label: "وصف مختصر للالتزام الديني",
      type: "textarea",
      group: RELIGION_GROUP,
    },
    // --- العمل والتعليم ---
    {
      id: "educationLevel",
      label: "المستوى التعليمي",
      type: "select",
      options: ["ثانوي", "دبلوم", "بكالوريوس", "ماجستير", "دكتوراه"],
      group: WORK_GROUP,
      required: true,
    },
    {
      id: "fieldOfStudy",
      label: "التخصص",
      type: "text",
      group: WORK_GROUP,
    },
    {
      id: "job",
      label: "العمل الحالي (إن وُجد)",
      type: "text",
      group: WORK_GROUP,
    },
    {
      id: "willingToWorkAfterMarriage",
      label: "الرغبة في العمل بعد الزواج",
      type: "select",
      options: ["نعم", "لا", "حسب الظروف"],
      group: WORK_GROUP,
    },
    // --- عن المتقدمة ---
    {
      id: "aboutMe",
      label: "نبذة عن شخصيتي وطباعي",
      type: "textarea",
      group: ABOUT_FEMALE_GROUP,
      required: true,
    },
    {
      id: "familyDescription",
      label: "نبذة عن الأسرة",
      type: "textarea",
      group: ABOUT_FEMALE_GROUP,
    },
    // --- المطلوب في الشريك ---
    {
      id: "seeking",
      label: "المطلوب في شريك الحياة",
      type: "textarea",
      group: SEEKING_FEMALE_GROUP,
      required: true,
      inCard: true,
    },
    {
      id: "seekingAgeRange",
      label: "الفئة العمرية المطلوبة",
      type: "text",
      group: SEEKING_FEMALE_GROUP,
    },
  ],
};

// Ordered ids for the browse summary card.
export const CARD_FIELDS: string[] = [
  "age",
  "maritalStatus",
  "seeking",
  "residence",
  "dress",
  "nationality",
];
