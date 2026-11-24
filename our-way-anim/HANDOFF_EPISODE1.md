# העברה לשיחה המקומית: Our Way, פרק 1 – "היום שבו המכונות למדו לדבר"

## מה הערוץ
- **Our Way** (@Our_Way). סרטונים שפותחים את הראש על העתיד שלנו.
- כל פרק הוא מכתב מ**אליאן**, ארכיונאי בארכיון העתיד בשנת 2140, שכותב לאנשי 2026.
- הטון חם ומשועשע, עם רגע אחד בכל פרק של געגוע לעבר פשוט יותר.
- שפה: אנגלית קודם, עברית בהמשך.
- משפט הסיום הקבוע: "See you in the future. You're already on your way."

## מה כבר קיים בתיקייה הזו
- צינור אנימציה מוכן: Remotion עם three.js, כולל פילטר דיו, טשטוש עדשה, זוהר וגרייד צבע (`src/videos/buddha/`: `ink.ts`, `lensblur.ts`, `grade.ts`).
- דמויות שמצוירות בקוד על כרטיסים (`figures.ts`), טקסטורות מצוירות (`paint.ts`), עולם עם כמה תפאורות ותאורות (`world.ts`), טבלת שוטים וכתוביות (`Buddha.tsx`, `captions.ts`).
- מוזיקה שנבנית בקוד: `audio/music.py`.
- דוגמה מוגמרת: `renders/OurWay_Buddha_Part1.mp4`.
- סרטון הבודהה נשאר כאן כתבנית טכנית. **לא ממשיכים אותו.** משתמשים בכלים, לא בתוכן.

## המשימה
1. לבנות תיקייה חדשה `src/videos/elian/` על בסיס הכלים של `buddha/`.
2. **להתחיל בשורט** "המראה השנייה", באורך 45 עד 60 שניות, אנכי 1080 על 1920. זה הפיילוט. את הפרק המלא (9 דקות) עושים רק אחרי שהשורט מאושר.
3. אם יש בשיחה הזו סקילים של וידאו, לבדוק אותם ולהשתמש בהם כשהם עדיפים על הצינור הקיים.
4. לבקש מהמשתמש הקלטת קול של אליאן לטקסט של השורט (מ-ElevenLabs), או להשתמש בהקלטה שהוא נותן.
5. רינדור על המחשב המקומי: לנסות קודם `gl: "angle"` (כרטיס Intel Iris Xe). אם נכשל, לחזור ל-`"swangle"`.
6. לעבוד בשלבים ממוספרים, ולענות למשתמש בעברית עם כמה שפחות מילים באנגלית.

## הסגנון
- **העתיד (2140):** אולם ארכיון בהיר ונקי, מדפים אינסופיים, אור זהוב דרך חלונות גבוהים, אובך עדין, כחול לילה וזהב, אווירה שקטה ומכבדת.
- **ההווה (שנות ה-2020):** נראה כמו תמונת ארכיון ישנה: צבעים דהויים, גרעין, שריטות, צהבהב.
- אליאן תמיד בגב למצלמה, או בצללית. לא רואים לו פנים.
- **התמונה הממוזערת:** מעטפה ישנה על רקע כחול לילה, חותמת שעווה זהובה "2140", בועת צ'אט זוהרת שבוקעת מתוכה, טקסט גדול THEY SPOKE.

## טקסט השורט "המראה השנייה" (קריינות)
> You are living, right now, inside the most quoted chapter of our history books. And most of you haven't even noticed.
>
> On November 30th, 2022, a company released a simple chat window to the public. No parade. No speech. Just a box where you could type. Within about two months, an estimated hundred million people had tried it. They asked it to write birthday poems, fix their code, write the email they were too afraid to write. Teachers panicked. Programmers laughed, and then went quiet. And somewhere, a lonely person talked to it all night long.
>
> That was the day the machines learned to speak. In our history books, we don't call it a technological event. We call it the Second Mirror. The first mirror showed you your face. This one showed you your words.
>
> See you in the future. You're already on your way.

הצעה לשוטים: מסך שחור ומכתב שנפתח באור זהוב, אולם הארכיון, תאריך 30.11.2022 על לוח שנה דהוי, סמן מהבהב בתיבה ריקה בחדר חשוך, מונטאז' של מסכים (שיר יום הולדת, קוד, מייל), מורה מבוהלת, אדם לבד מול מסך בלילה, מראה שמשקפת פנים ואז הופכת למילים, חותמת שעווה 2140.

## התחזית האישית של המשתמש (נכנסת לפרק המלא, לפני הסיום)
> I'm not allowed to tell you everything about your future. But I can tell you this.
> You are living through a revolution as big as the Industrial Revolution, the one that changed the face of humanity. But that one was slow. It took generations. Yours is moving at speed c. The speed of light.
> A person in the Middle Ages could never have imagined cars racing along roads. And you, today, cannot imagine how we travel. I'll only say this: not all of it is physical. Some of our journeys begin with a door, and end on the other side of the world.
> You are standing at the start of a great and powerful age. Most of you still don't feel how big it is. From where I'm standing, I can tell you: it was enormous.

## התסריט המלא
נמצא במסמך הגוגל "Our Way, פרק 1: היום שבו המכונות למדו לדבר" (באנגלית ובעברית, עם זמנים וסצנות). שני שורטים נוספים מתוכו: "המקלדת במוזיאון" (כ-30 שניות) ו"אני מקנא בכם" (כ-50 שניות).
