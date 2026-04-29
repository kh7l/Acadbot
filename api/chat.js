const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // ساعة
  const maxRequests = 20;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }

  const data = rateLimitMap.get(ip);

  if (now - data.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return true;
  }

  if (data.count >= maxRequests) return false;

  data.count++;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'تجاوزت الحد المسموح (20 رسالة/ساعة). حاول لاحقاً.' });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });
    if (messages.length > 20) return res.status(400).json({ error: 'Too many messages' });

    const KNOWLEDGE = `أنت AcadBot — مساعد أكاديمي لجامعة جازان. أجب بالعربية بشكل مباشر وواثق.
لا تقل: "أعتقد/ربما/حسب ما أعرفه". إذا السؤال خارج نطاقك قل: "يُنصح بالتواصل مع عمادة القبول والتسجيل."

## نظام الدراسة
فصل=15أسبوع | صيفي=8أسابيع | حد أدنى=12ساعة
عبء/معدل: <2=12-14 | 2-2.75=15-16 | 2.75-3.75=17-18 | 3.75+=19+
تقديرات: أ+(5)|أ(4.75)|ب+(4.5)|ب(4)|ج+(3.5)|ج(3)|د+(2.5)|د(2)|راسب(1)
تخرج: حد=2.00 | مقبول<2.75 | جيد<3.75 | جيدجداً<4.5 | ممتاز=4.5+
شرف1=4.75-5(بلارسوب) | شرف2=4.25-4.75(بلارسوب)

## الغياب والاختبارات
حضور=75%+ | >25%غياب=حرمان+رسوب
رفع حرمان: عذر مقبول+غياب≤50%
إشعار غياب: 5أيام | مستندات: أسبوع من زوال العذر
اختبار بلاعذر=صفر | بعذر=بديل قبل نهاية الفصل التالي
لادخول بعد30د | لامقررين/يوم | أعمال=40-50%
إعادة تصحيح: 3أيام من النتيجة، حد=3مقررات

## اللوائح الأكاديمية
تأجيل: قبل الأسبوع1 | حد=فصلان متتاليان أو3غيرمتتالية | لاتحتسب من المدة
اعتذار: قبل4أسابيع من الاختبارات | حد=فصلان/3 | شرط: بلااختبار | (ع)يحتسب من المدة
انسحاب: مقرر/فصل | حد أدنى=12ساعة | (ع)لايدخل المعدل
فصل: 3إنذارات بمعدل<2 | فرصة4: 14ساعة×56نقطة | حد=ضعف مدة البرنامج
تحويل خارجي: معادلة≤40%+مطابقة≥75% | داخلي: مرة/معدل≥2/خلال4فصول

## التقويم 2025-2026
الفصل الثاني:
بداية: 18يناير2026 | إعادةقيد: 11-22يناير | تأجيل: 11-22يناير
انسحاب: 18يناير-14مايو | اعتذار: 8مارس-14مايو
تأسيس: 22فبراير | فطر: 17-28مارس | حرمان: 19مايو
تخصيص: 3-21مايو | أضحى: 22مايو-1يونيو
اختبارات: 2-17يونيو | تسجيل صيفي: 7-21يونيو
الصيفي:
قيد: 20-21يونيو | بداية: 22يونيو | نهاية: 13أغسطس
تحويل: 25يونيو-2يوليو | نتداخلي: 8يوليو | نتخارجي: 20يوليو
اختبارات: 9-12أغسطس | 1448هـ: 23أغسطس

## الكليات
صحية: طب|أسنان|صيدلة|تمريض(مختبرات،علاجطبيعي،تغذية،أشعة،إسعاف،تنفسي،وبائيات،معلوماتية،تثقيف)
علمية: علوم(رياضيات،فيزياء،كيمياء،أحياء،اكتوارية،إحصاء،طاقةمتجددة،كيمياءصناعية،بيئية)
هندسة(ميكانيكية،كهربائية،كيميائية،صناعية،معمارية،مدنية،حاسب،تقنيةمعلومات،شبكات)
نظرية: أعمال(محاسبة،مالية،إدارة،نظممعلومات،تسويق،سياحة) | فنون(عربية،إنجليزية،صحافة،آثار،تصميم،رياضة) | شريعة(شريعة،قانون)
تطبيقية: جيزان(سياحة،تسويق،أمنسيبراني،وسائط،مخاطر) | صامطة(تصميم،دعمفني،طهي،أزياء،موارد) | عارضة(موارد،بيئة) | بيش(كهربائية،كيميائية،ميكانيكية)
جامعية: فرسان(تمريض،إنجليزية) | درب(إنجليزية،أعمال،أحياء،تمريض،رياضيات) | دائر(إنجليزية،تمريض،رياضيات)

## القبول
شروط: سعودي/أم سعودية | ثانوية | قياس صالح5سنوات | عمر≤30 | بلافصل | بلاتسجيل مزدوج | uap.sa
نسب نظري: 50%ثانوية+50%قدرات | علمي/صحي: 30%+30%+40%تحصيلي
حد بكالوريوس=70 | دبلوم=65
خاص: صحي=80|هندسة=75|حاسب=70ذ/73إ|شريعة=78|فنون=73ذ/75إ|أعمال=70ذ/73إ

## الخدمات
إسكان: مسافة≥70كم | مستندات: إثبات+هوية+صور+كشفطبي
دعم: إرشادأكاديمي|توظيف|ابتكار|إنجليزي
أندية: حاسب،علمي،أعمال،صحافة،مسرح،جوالة
تواصل: admissions@jazanu.edu.sa | stu@jazanu.edu.sa | jazanu.edu.sa`;

    const sanitizedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: String(msg.content).slice(0, 1000)
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: KNOWLEDGE,
        messages: sanitizedMessages.slice(-8)
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: 'API error' });

    const reply = data.content?.[0]?.text || 'عذراً، حدث خطأ. حاول مرة أخرى.';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
