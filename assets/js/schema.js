/*
 * Skema kuesioner (dipakai form survei DAN dashboard).
 * PENTING: ID item di sini harus sama dengan ITEM_IDS di backend/Code.gs.
 * Cek otomatis: `node tests/check-schema.js`
 */
(function () {
  var L = function (id, en, zh, ar, th) { return { id: id, en: en, zh: zh, ar: ar, th: th }; };

  var SCHEMA = {
    version: "1.0",

    langs: [
      { code: "id", name: "Bahasa Indonesia", dir: "ltr", locale: "id" },
      { code: "en", name: "English", dir: "ltr", locale: "en" },
      { code: "zh", name: "简体中文", dir: "ltr", locale: "zh-CN" },
      { code: "ar", name: "العربية", dir: "rtl", locale: "ar" },
      { code: "th", name: "ไทย", dir: "ltr", locale: "th" }
    ],

    scales: {
      sat: {
        id: ["Sangat tidak puas", "Tidak puas", "Cukup puas", "Puas", "Sangat puas"],
        en: ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"],
        zh: ["非常不满意", "不满意", "一般", "满意", "非常满意"],
        ar: ["غير راضٍ إطلاقًا", "غير راضٍ", "محايد", "راضٍ", "راضٍ جدًا"],
        th: ["ไม่พอใจอย่างยิ่ง", "ไม่พอใจ", "เฉย ๆ", "พอใจ", "พอใจมาก"]
      },
      likelihood: {
        id: ["Sangat kecil", "Kecil", "Mungkin", "Besar", "Sangat besar"],
        en: ["Very unlikely", "Unlikely", "Possibly", "Likely", "Very likely"],
        zh: ["非常不可能", "不太可能", "有可能", "很可能", "非常可能"],
        ar: ["مستبعد جدًا", "مستبعد", "ممكن", "محتمل", "محتمل جدًا"],
        th: ["ไม่น่าเป็นไปได้เลย", "ไม่น่าจะ", "อาจจะ", "น่าจะ", "น่าจะอย่างยิ่ง"]
      }
    },

    // Dimensi penilaian (skala 1-5, boleh "Tidak berlaku")
    dimensions: [
      {
        id: "COM",
        name: L("Komunikasi & Responsivitas", "Communication & Responsiveness", "沟通与响应", "التواصل والاستجابة", "การสื่อสารและการตอบสนอง"),
        items: [
          { id: "COM1", t: L("Kemudahan menghubungi pihak UMB yang relevan", "Ease of reaching the relevant UMB contact", "联系相关UMB人员的便利程度", "سهولة التواصل مع الجهة المعنية في الجامعة", "ความสะดวกในการติดต่อผู้เกี่ยวข้องของ UMB") },
          { id: "COM2", t: L("Kecepatan UMB menanggapi pertanyaan atau permintaan Anda", "UMB's speed in responding to your questions or requests", "UMB回复您的询问或请求的速度", "سرعة استجابة الجامعة لاستفساراتكم أو طلباتكم", "ความรวดเร็วของ UMB ในการตอบคำถามหรือคำขอของท่าน") },
          { id: "COM3", t: L("Kejelasan dan ketepatan informasi yang diberikan UMB", "Clarity and accuracy of the information provided by UMB", "UMB所提供信息的清晰度和准确性", "وضوح ودقة المعلومات التي تقدمها الجامعة", "ความชัดเจนและความถูกต้องของข้อมูลที่ UMB ให้") },
          { id: "COM4", t: L("Keterbukaan UMB terhadap masukan dan usulan Anda", "UMB's openness to your feedback and proposals", "UMB对您的意见和建议的开放程度", "تقبّل الجامعة لملاحظاتكم ومقترحاتكم", "ความเปิดกว้างของ UMB ต่อข้อเสนอแนะและข้อเสนอของท่าน") }
        ]
      },
      {
        id: "ADM",
        name: L("Administrasi & Dokumen Kerja Sama", "Administration & Cooperation Documents", "行政与合作文件", "الإجراءات الإدارية ووثائق التعاون", "งานธุรการและเอกสารความร่วมมือ"),
        items: [
          { id: "ADM1", t: L("Kemudahan dan kecepatan penyusunan serta penandatanganan MoU/MoA/IA", "Ease and speed of drafting and signing the MoU/MoA/IA", "起草及签署MoU/MoA/IA的便捷性和速度", "سهولة وسرعة إعداد وتوقيع مذكرة التفاهم/اتفاقية التعاون/اتفاقية التنفيذ", "ความสะดวกและความรวดเร็วในการจัดทำและลงนาม MoU/MoA/IA") },
          { id: "ADM2", t: L("Kejelasan prosedur dan persyaratan kerja sama", "Clarity of cooperation procedures and requirements", "合作程序和要求的清晰度", "وضوح إجراءات التعاون ومتطلباته", "ความชัดเจนของขั้นตอนและข้อกำหนดในการร่วมมือ") },
          { id: "ADM3", t: L("Ketepatan waktu dan kelengkapan dokumen administrasi (surat, laporan, sertifikat, dll.)", "Timeliness and completeness of administrative documents (letters, reports, certificates, etc.)", "行政文件（信函、报告、证书等）的及时性和完整性", "الالتزام بالمواعيد واكتمال الوثائق الإدارية (الخطابات والتقارير والشهادات وغيرها)", "ความตรงเวลาและความครบถ้วนของเอกสารธุรการ (หนังสือ รายงาน ใบรับรอง ฯลฯ)") }
        ]
      },
      {
        id: "IMP",
        name: L("Pelaksanaan & Mutu Program", "Implementation & Programme Quality", "项目实施与质量", "تنفيذ البرامج وجودتها", "การดำเนินโครงการและคุณภาพ"),
        items: [
          { id: "IMP1", t: L("Kesesuaian pelaksanaan kegiatan dengan perjanjian dan rencana yang disepakati", "Conformity of activities with the agreed terms and plan", "活动实施与约定的协议和计划相符程度", "مطابقة تنفيذ الأنشطة للاتفاقية والخطة المتفق عليها", "ความสอดคล้องของการดำเนินกิจกรรมกับข้อตกลงและแผนที่ตกลงกันไว้") },
          { id: "IMP2", t: L("Ketepatan waktu pelaksanaan kegiatan", "Timeliness of activity implementation", "活动实施的及时性", "الالتزام بالجدول الزمني لتنفيذ الأنشطة", "ความตรงเวลาในการดำเนินกิจกรรม") },
          { id: "IMP3", t: L("Kualitas hasil atau luaran kegiatan kerja sama", "Quality of the results or outputs of the cooperation", "合作活动成果或产出的质量", "جودة نتائج أو مخرجات أنشطة التعاون", "คุณภาพของผลลัพธ์หรือผลผลิตจากความร่วมมือ") },
          { id: "IMP4", t: L("Kesungguhan UMB memenuhi komitmen dan kewajibannya", "UMB's commitment to fulfilling its obligations", "UMB履行承诺和义务的诚意", "جدية الجامعة في الوفاء بالتزاماتها وتعهداتها", "ความมุ่งมั่นของ UMB ในการปฏิบัติตามข้อผูกพันและหน้าที่") }
        ]
      },
      {
        id: "STF",
        name: L("SDM & Profesionalisme", "People & Professionalism", "人员与专业素养", "الكوادر البشرية والمهنية", "บุคลากรและความเป็นมืออาชีพ"),
        items: [
          { id: "STF1", t: L("Kompetensi dosen, tenaga kependidikan, atau mahasiswa UMB yang terlibat", "Competence of the UMB lecturers, staff, or students involved", "参与的UMB教师、职员或学生的能力", "كفاءة أعضاء هيئة التدريس والموظفين أو الطلاب المشاركين من الجامعة", "ความสามารถของอาจารย์ บุคลากร หรือนักศึกษา UMB ที่เกี่ยวข้อง") },
          { id: "STF2", t: L("Sikap profesional, ramah, dan menghargai perbedaan budaya", "Professional, courteous attitude and respect for cultural differences", "专业、友善并尊重文化差异的态度", "السلوك المهني والودّي واحترام الاختلافات الثقافية", "ทัศนคติที่เป็นมืออาชีพ เป็นมิตร และเคารพความแตกต่างทางวัฒนธรรม") },
          { id: "STF3", t: L("Inisiatif dan komitmen pihak UMB dalam menjalankan kerja sama", "Initiative and commitment shown by UMB in carrying out the cooperation", "UMB在推进合作中的主动性和投入", "مبادرة الجامعة والتزامها في تنفيذ التعاون", "ความริเริ่มและความมุ่งมั่นของ UMB ในการดำเนินความร่วมมือ") }
        ]
      },
      {
        id: "FAC",
        name: L("Fasilitas & Layanan Pendukung", "Facilities & Support Services", "设施与支持服务", "المرافق والخدمات المساندة", "สิ่งอำนวยความสะดวกและบริการสนับสนุน"),
        items: [
          { id: "FAC1", t: L("Kualitas fasilitas yang tersedia (ruang, laboratorium, perpustakaan, dll.)", "Quality of available facilities (rooms, laboratories, library, etc.)", "现有设施（教室、实验室、图书馆等）的质量", "جودة المرافق المتاحة (القاعات والمختبرات والمكتبة وغيرها)", "คุณภาพของสิ่งอำนวยความสะดวก (ห้อง ห้องปฏิบัติการ ห้องสมุด ฯลฯ)") },
          { id: "FAC2", t: L("Layanan bagi tamu atau peserta dari pihak Anda (penyambutan, akomodasi, transportasi, bantuan administrasi)", "Services for your guests or participants (reception, accommodation, transport, administrative help)", "为贵方来宾或参与者提供的服务（接待、住宿、交通、行政协助）", "الخدمات المقدمة لضيوفكم أو مشاركيكم (الاستقبال والإقامة والنقل والمساعدة الإدارية)", "บริการสำหรับแขกหรือผู้เข้าร่วมของท่าน (การต้อนรับ ที่พัก การเดินทาง การช่วยเหลือด้านเอกสาร)") },
          { id: "FAC3", t: L("Ketersediaan sarana dan platform digital untuk koordinasi atau kegiatan daring", "Availability of digital tools and platforms for coordination or online activities", "用于协调或线上活动的数字工具和平台", "توفر الأدوات والمنصات الرقمية للتنسيق أو الأنشطة عبر الإنترنت", "ความพร้อมของเครื่องมือและแพลตฟอร์มดิจิทัลสำหรับการประสานงานหรือกิจกรรมออนไลน์") }
        ]
      },
      {
        id: "BEN",
        name: L("Manfaat & Dampak", "Benefits & Impact", "效益与影响", "الفوائد والأثر", "ประโยชน์และผลกระทบ"),
        items: [
          { id: "BEN1", t: L("Manfaat kerja sama bagi institusi Anda", "Benefits of the cooperation for your institution", "合作对贵机构的益处", "فائدة التعاون لمؤسستكم", "ประโยชน์ของความร่วมมือต่อองค์กรของท่าน") },
          { id: "BEN2", t: L("Kesesuaian hasil kerja sama dengan tujuan atau harapan awal Anda", "How well the results meet your original goals or expectations", "合作成果与您最初目标或期望的契合度", "مدى توافق نتائج التعاون مع أهدافكم أو توقعاتكم الأولية", "ความสอดคล้องของผลลัพธ์กับเป้าหมายหรือความคาดหวังเดิมของท่าน") },
          { id: "BEN3", t: L("Dampak berkelanjutan (mis. program lanjutan, publikasi, jejaring)", "Lasting impact (e.g., follow-up programmes, publications, networks)", "可持续的影响（如后续项目、出版物、人脉网络）", "الأثر المستدام (مثل البرامج اللاحقة والمنشورات وشبكات العلاقات)", "ผลกระทบที่ยั่งยืน (เช่น โครงการต่อเนื่อง สิ่งตีพิมพ์ เครือข่าย)") }
        ]
      },
      {
        id: "FUP",
        name: L("Evaluasi & Tindak Lanjut", "Evaluation & Follow-up", "评估与跟进", "التقييم والمتابعة", "การประเมินและการติดตามผล"),
        items: [
          { id: "FUP1", t: L("Pemantauan dan evaluasi berkala yang dilakukan UMB terhadap kerja sama", "Regular monitoring and evaluation of the cooperation by UMB", "UMB对合作的定期监测与评估", "المتابعة والتقييم الدوريان للتعاون من جانب الجامعة", "การติดตามและประเมินผลความร่วมมืออย่างสม่ำเสมอโดย UMB") },
          { id: "FUP2", t: L("Tindak lanjut UMB atas keluhan atau masukan Anda", "UMB's follow-up on your complaints or feedback", "UMB对您的投诉或意见的跟进处理", "متابعة الجامعة لشكاواكم أو ملاحظاتكم", "การติดตามแก้ไขข้อร้องเรียนหรือข้อเสนอแนะของท่านโดย UMB") },
          { id: "FUP3", t: L("Transparansi pelaporan hasil kerja sama kepada Anda", "Transparency in reporting cooperation results to you", "向您通报合作成果的透明度", "شفافية إبلاغكم بنتائج التعاون", "ความโปร่งใสในการรายงานผลความร่วมมือให้ท่านทราบ") }
        ]
      }
    ],

    // Penilaian keseluruhan
    overall: [
      { id: "OVR1", scale: "sat", t: L("Secara keseluruhan, seberapa puas Anda bekerja sama dengan UMB?", "Overall, how satisfied are you with your cooperation with UMB?", "总体而言，您对与UMB的合作有多满意？", "بشكل عام، ما مدى رضاكم عن التعاون مع الجامعة؟", "โดยรวมแล้ว ท่านพึงพอใจกับการร่วมมือกับ UMB มากเพียงใด") },
      { id: "OVR2", scale: "likelihood", t: L("Seberapa besar kemungkinan Anda melanjutkan atau memperluas kerja sama dengan UMB?", "How likely are you to continue or expand your cooperation with UMB?", "您继续或扩大与UMB合作的可能性有多大？", "ما مدى احتمال استمراركم في التعاون مع الجامعة أو توسيعه؟", "ท่านมีแนวโน้มที่จะร่วมมือกับ UMB ต่อเนื่องหรือขยายความร่วมมือเพียงใด") }
    ],

    nps: {
      id: "NPS",
      t: L("Seberapa besar kemungkinan Anda merekomendasikan UMB sebagai mitra kerja sama kepada institusi lain?", "How likely are you to recommend UMB as a cooperation partner to other institutions?", "您向其他机构推荐UMB作为合作伙伴的可能性有多大？", "ما مدى احتمال أن توصوا بالجامعة كشريك تعاون لمؤسسات أخرى؟", "ท่านมีแนวโน้มที่จะแนะนำ UMB เป็นพันธมิตรความร่วมมือให้แก่องค์กรอื่นเพียงใด"),
      low: L("Sangat tidak mungkin", "Not at all likely", "完全不可能", "غير محتمل إطلاقًا", "ไม่น่าเป็นไปได้เลย"),
      high: L("Sangat mungkin", "Extremely likely", "非常可能", "محتمل جدًا", "เป็นไปได้อย่างยิ่ง")
    },

    activities: [
      { id: "student_mobility", t: L("Mobilitas / pertukaran mahasiswa", "Student mobility / exchange", "学生交流/互换", "تبادل وتنقّل الطلاب", "การแลกเปลี่ยน/เคลื่อนย้ายนักศึกษา") },
      { id: "staff_mobility", t: L("Mobilitas dosen & tenaga kependidikan (visiting)", "Lecturer & staff mobility (visiting)", "教师及职员交流（访问）", "تنقّل أعضاء هيئة التدريس والموظفين (زيارات)", "การแลกเปลี่ยนอาจารย์และบุคลากร (เยือน)") },
      { id: "joint_research", t: L("Penelitian bersama", "Joint research", "联合研究", "بحوث مشتركة", "วิจัยร่วม") },
      { id: "joint_publication", t: L("Publikasi bersama", "Joint publication", "联合发表", "نشر مشترك", "ตีพิมพ์ร่วม") },
      { id: "community_service", t: L("Pengabdian kepada masyarakat", "Community service", "社区服务", "خدمة المجتمع", "บริการสังคม") },
      { id: "internship", t: L("Magang / PKL / MBKM", "Internship / practicum / MBKM", "实习/实践/MBKM", "التدريب الميداني / برنامج MBKM", "ฝึกงาน/ฝึกประสบการณ์/MBKM") },
      { id: "seminar", t: L("Seminar, konferensi, atau webinar bersama", "Joint seminar, conference, or webinar", "联合研讨会、会议或网络研讨会", "ندوات ومؤتمرات أو ندوات إلكترونية مشتركة", "สัมมนา ประชุมวิชาการ หรือเว็บินาร์ร่วม") },
      { id: "joint_degree", t: L("Double degree / transfer kredit / program bersama", "Double degree / credit transfer / joint programme", "双学位/学分转换/联合项目", "الدرجة المزدوجة / تحويل الساعات / برامج مشتركة", "ปริญญาคู่/โอนหน่วยกิต/หลักสูตรร่วม") },
      { id: "short_program", t: L("Program jangka pendek (summer/winter school, pelatihan)", "Short programme (summer/winter school, training)", "短期项目（夏令营/冬令营、培训）", "برامج قصيرة (مدارس صيفية/شتوية، تدريب)", "โครงการระยะสั้น (summer/winter school การฝึกอบรม)") },
      { id: "scholarship", t: L("Beasiswa", "Scholarship", "奖学金", "منح دراسية", "ทุนการศึกษา") },
      { id: "curriculum", t: L("Pengembangan kurikulum", "Curriculum development", "课程开发", "تطوير المناهج", "พัฒนาหลักสูตร") },
      { id: "certification", t: L("Pelatihan dan sertifikasi kompetensi", "Competency training & certification", "能力培训与认证", "التدريب والاعتماد المهني", "การฝึกอบรมและรับรองสมรรถนะ") },
      { id: "recruitment", t: L("Rekrutmen / penyerapan lulusan", "Graduate recruitment / placement", "毕业生招聘/就业", "توظيف الخريجين", "การรับสมัคร/จ้างงานบัณฑิต") },
      { id: "consulting", t: L("Konsultasi atau layanan profesional", "Consulting / professional services", "咨询或专业服务", "الاستشارات أو الخدمات المهنية", "การให้คำปรึกษา/บริการวิชาชีพ") },
      { id: "facility_sharing", t: L("Penggunaan fasilitas bersama", "Shared use of facilities", "共享设施", "الاستخدام المشترك للمرافق", "ใช้สิ่งอำนวยความสะดวกร่วมกัน") },
      { id: "publishing", t: L("Penerbitan buku atau jurnal", "Book / journal publishing", "图书/期刊出版", "نشر الكتب أو المجلات", "การจัดพิมพ์หนังสือ/วารสาร") },
      { id: "other", t: L("Lainnya", "Other", "其他", "أخرى", "อื่น ๆ") }
    ],

    instTypes: [
      { id: "university", t: L("Perguruan tinggi", "University / higher education", "高等院校", "جامعة / مؤسسة تعليم عالٍ", "มหาวิทยาลัย/สถาบันอุดมศึกษา") },
      { id: "school", t: L("Sekolah / lembaga pendidikan lain", "School / other educational institution", "学校/其他教育机构", "مدرسة / مؤسسة تعليمية أخرى", "โรงเรียน/สถาบันการศึกษาอื่น") },
      { id: "government", t: L("Pemerintah / lembaga negara", "Government agency", "政府机构", "جهة حكومية", "หน่วยงานรัฐ") },
      { id: "industry", t: L("Industri / perusahaan", "Industry / company", "企业/公司", "شركة / قطاع صناعي", "ภาคอุตสาหกรรม/บริษัท") },
      { id: "ngo", t: L("Organisasi nirlaba / LSM / yayasan", "Non-profit / NGO / foundation", "非营利组织/非政府组织/基金会", "منظمة غير ربحية / مؤسسة", "องค์กรไม่แสวงหากำไร/NGO/มูลนิธิ") },
      { id: "association", t: L("Asosiasi / organisasi profesi", "Association / professional body", "协会/专业组织", "جمعية / هيئة مهنية", "สมาคม/องค์กรวิชาชีพ") },
      { id: "research", t: L("Lembaga penelitian", "Research institute", "研究机构", "معهد بحثي", "สถาบันวิจัย") },
      { id: "health", t: L("Rumah sakit / lembaga kesehatan", "Hospital / health institution", "医院/医疗机构", "مستشفى / مؤسسة صحية", "โรงพยาบาล/สถาบันสุขภาพ") },
      { id: "embassy", t: L("Perwakilan negara / organisasi internasional", "Embassy / international organisation", "使领馆/国际组织", "سفارة / منظمة دولية", "สถานทูต/องค์การระหว่างประเทศ") },
      { id: "other", t: L("Lainnya", "Other", "其他", "أخرى", "อื่น ๆ") }
    ],

    durations: [
      { id: "lt1", t: L("Kurang dari 1 tahun", "Less than 1 year", "不足1年", "أقل من سنة", "น้อยกว่า 1 ปี") },
      { id: "y1_3", t: L("1 sampai 3 tahun", "1 to 3 years", "1至3年", "من 1 إلى 3 سنوات", "1 ถึง 3 ปี") },
      { id: "y3_5", t: L("Lebih dari 3 hingga 5 tahun", "More than 3 up to 5 years", "3年以上至5年", "أكثر من 3 إلى 5 سنوات", "มากกว่า 3 ถึง 5 ปี") },
      { id: "gt5", t: L("Lebih dari 5 tahun", "More than 5 years", "5年以上", "أكثر من 5 سنوات", "มากกว่า 5 ปี") }
    ],

    docStatus: [
      { id: "mou", t: L("MoU (nota kesepahaman)", "MoU (Memorandum of Understanding)", "谅解备忘录 (MoU)", "مذكرة تفاهم (MoU)", "บันทึกข้อตกลงความร่วมมือ (MoU)") },
      { id: "moa", t: L("MoA / perjanjian kerja sama", "MoA / cooperation agreement", "MoA/合作协议", "اتفاقية تعاون (MoA)", "MoA/ข้อตกลงความร่วมมือ") },
      { id: "ia", t: L("IA / perjanjian pelaksanaan", "IA / implementation arrangement", "IA/实施协议", "اتفاقية تنفيذية (IA)", "IA/ข้อตกลงการดำเนินงาน") },
      { id: "process", t: L("Dalam proses penyusunan", "Being drafted", "正在起草中", "قيد الإعداد", "อยู่ระหว่างจัดทำ") },
      { id: "none", t: L("Belum ada dokumen formal", "No formal document yet", "尚无正式文件", "لا توجد وثيقة رسمية بعد", "ยังไม่มีเอกสารอย่างเป็นทางการ") },
      { id: "unknown", t: L("Tidak tahu", "Not sure", "不确定", "غير متأكد", "ไม่ทราบ") }
    ],

    unitCategories: [
      { id: "university", t: L("Universitas / pimpinan", "University level / leadership", "大学层面/校领导", "على مستوى الجامعة / القيادة", "ระดับมหาวิทยาลัย/ผู้บริหาร") },
      { id: "faculty", t: L("Fakultas", "Faculty", "学院", "كلية", "คณะ") },
      { id: "program", t: L("Program Studi", "Study programme", "专业", "برنامج دراسي", "หลักสูตร/สาขาวิชา") },
      { id: "institute", t: L("Lembaga / Pusat", "Institute / Centre", "研究所/中心", "مؤسسة / مركز", "สถาบัน/ศูนย์") },
      { id: "bureau", t: L("Biro", "Bureau", "办公室/处", "مكتب / إدارة", "สำนัก") },
      { id: "unit", t: L("Unit lain", "Other unit", "其他单位", "وحدة أخرى", "หน่วยงานอื่น") }
    ]
  };

  // Daftar ID item berskala (urutan = urutan kolom di Sheet)
  SCHEMA.itemIds = [];
  SCHEMA.dimensions.forEach(function (d) { d.items.forEach(function (i) { SCHEMA.itemIds.push(i.id); }); });
  SCHEMA.overall.forEach(function (i) { SCHEMA.itemIds.push(i.id); });
  SCHEMA.itemIds.push(SCHEMA.nps.id);

  // Pencari label
  SCHEMA.label = function (list, id, lang) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].t[lang] || list[i].t.en;
    return id;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SCHEMA;
  else window.SCHEMA = SCHEMA;
})();
