# my-ai-bot

צ׳אט AI פשוט בעברית, עם ממשק בדפדפן ושרת Node.js ששומר את מפתח ה-API בצד השרת.

## הפעלה

נדרש Node.js 18 ומעלה ומפתח API של OpenAI.

1. שכפלו את המאגר והיכנסו לתיקייה:
   ```bash
   git clone https://github.com/Neorai2013/my-ai-bot.git
   cd my-ai-bot
   ```
2. הגדירו את המפתח בסביבה שבה תריצו את השרת (אל תכניסו אותו לקובץ קוד או לדפדפן):

   macOS / Linux:
   ```bash
   export OPENAI_API_KEY="המפתח-שלכם"
   ```

   Windows PowerShell:
   ```powershell
   $env:OPENAI_API_KEY="המפתח-שלכם"
   ```

3. הפעילו:
   ```bash
   npm start
   ```
4. פתחו בדפדפן את [http://localhost:3000](http://localhost:3000).

אפשר לבחור מודל אחר באמצעות משתנה הסביבה `OPENAI_MODEL` (ברירת המחדל היא `gpt-4o-mini`) או לשנות את מספר הפורט באמצעות `PORT`.

## אבטחת מפתח

השרת קורא את `OPENAI_API_KEY` מהסביבה. אין לשתף את המפתח או לשמור אותו בקוד, בקובצי האתר, או במאגר GitHub. שימוש ב-API עשוי להיות כרוך בחיוב לפי חשבון OpenAI.
