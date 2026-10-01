# ویدئوی لپ‌تاپ برای ریلز

`laptop-reel.mp4`: لپ‌تاپ روی میز در فضای تاریک، با نور سبز از پشت. سایت «در بیرجند کجا؟» با همه‌ی انیمیشن‌هاش داخل صفحه‌ی لپ‌تاپ اسکرول می‌شه. ۱۰۸۰×۱۹۲۰، ۳۰ فریم، ۱۵ ثانیه، بدون صدا.

## ساخت دوباره
```bash
# از ریشه‌ی مخزن
python3 -m http.server 8123 &
# ۱) ضبط اسکرول سایت روی ساعت مجازی (فریم‌به‌فریم و بدون پرش)
node video/capture-screen.js http://localhost:8123/index.html /tmp/screen [پوشه‌ی فایل‌های gsap برای حالت آفلاین]
# ۲) رندر صحنه‌ی سه‌بعدی لپ‌تاپ (scene.html) با فریم‌های سایت
(cd /tmp && python3 -m http.server 8124 &)
node video/render-scene.js http://localhost:8123/video/scene.html http://localhost:8124/screen /tmp/final
# ۳) ساخت MP4
ffmpeg -framerate 30 -i /tmp/final/f%04d.png -c:v libx264 -crf 17 -pix_fmt yuv420p -movflags +faststart video/laptop-reel.mp4
```
- نقطه‌های توقف اسکرول در آرایه‌ی `KEYS` داخل `capture-screen.js` هستن.
- حرکت دوربین، رنگ نور و روشن‌شدن چراغ‌ها در تابع `setFrame` داخل `scene.html` تنظیم می‌شن.
