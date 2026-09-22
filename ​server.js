const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer দিয়ে টেম্পোরারি ফাইল রিসিভ করার কনফিগারেশন
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // public ফোল্ডারে index.html থাকলে সেটিকে সার্ভ করবে

// --- ব্যাকএন্ড ফাইল আপলোড API (Catbox-এ পাঠানোর জন্য) ---
app.post('/api/upload-catbox', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'কোনো ফাইল পাওয়া যায়নি' });
    }

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', fs.createReadStream(req.file.path), req.file.originalname);

    // ব্যাকএন্ড থেকে সার্ভার-টু-সার্ভার Catbox-এ ভিডিও পাঠানো হচ্ছে
    const response = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: formData.getHeaders(),
    });

    // লোকাল টেম্পোরারি ফাইল ডিলিট
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // ব্যাকএন্ড সরাসরি ভিডিওর ডাইরেক্ট লিঙ্ক ফেরত পাঠাবে
    res.json({ url: response.data.trim() });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload Server Error:', error);
    res.status(500).json({ error: 'ভিডিও আপলোড করতে ব্যর্থ হয়েছে' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
