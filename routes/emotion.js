// server/routes/emotion.js
const express = require('express');
const router = express.Router();
const Emotion = require('../models/Emotion');

// Get all entries for a user
router.get('/:nationalId', async (req, res) => {
  try {
    const emotion = await Emotion.findOne({ nationalId: req.params.nationalId });
    res.json(emotion || { entries: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new entry
router.post('/entry', async (req, res) => {
  try {
    const { nationalId, entryData } = req.body;
    
    let emotion = await Emotion.findOne({ nationalId });
    if (!emotion) {
      emotion = new Emotion({ nationalId, entries: [] });
    }

    emotion.entries.push(entryData);
    await emotion.save();

    res.json({ success: true, emotion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specific entry
router.put('/entry/:nationalId/:entryId', async (req, res) => {
  try {
    const { nationalId, entryId } = req.params;
    const updateData = req.body;

    const emotion = await Emotion.findOne({ nationalId });
    if (!emotion) {
      return res.status(404).json({ error: 'User not found' });
    }

    const entryIndex = emotion.entries.findIndex(
      entry => entry._id.toString() === entryId
    );

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    emotion.entries[entryIndex] = {
      ...emotion.entries[entryIndex].toObject(),
      ...updateData
    };

    await emotion.save();
    res.json({ success: true, emotion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete entry
router.delete('/entry/:nationalId/:entryId', async (req, res) => {
  try {
    const { nationalId, entryId } = req.params;

    const emotion = await Emotion.findOne({ nationalId });
    if (!emotion) {
      return res.status(404).json({ error: 'User not found' });
    }

    emotion.entries = emotion.entries.filter(
      entry => entry._id.toString() !== entryId
    );

    await emotion.save();
    res.json({ success: true, emotion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emotion-specific questions
router.get('/questions/:emotion', async (req, res) => {
  const emotionQuestions = {
    Joy: [
      {
        id: 'joy_1',
        question: 'คุณรู้สึกมีความสุขหรือพอใจกับสิ่งที่จำได้มากแค่ไหน?'
      },
      {
        id: 'joy_2',
        question: 'มีช่วงเวลาไหนที่การจำได้ทำให้คุณรู้สึกดี?'
      }
    ],
    Trust: [
      {
        id: 'trust_1',
        question: 'คุณไว้ใจในความจำของตัวเองมากแค่ไหน?'
      },
      {
        id: 'trust_2',
        question: 'คุณเชื่อมั่นในความสามารถที่จะจำได้หรือไม่?'
      }
    ],
    Fear: [
      {
        id: 'fear_1',
        question: 'คุณกลัวการลทมมากแค่ไหน?'
      },
      {
        id: 'fear_2',
        question: 'มีสถานการณ์ไหนที่ทำให้คุณกังวลว่าจะจำไม่ได้?'
      }
    ],
    Surprise: [
      {
        id: 'surprise_1',
        question: 'คุณรู้สึกแปลกใจกับสิ่งที่จำได้หรือจำไม่ได้หรือไม่?'
      },
      {
        id: 'surprise_2',
        question: 'มีอะไรที่ทำให้คุณประหลาดใจเกี่ยวกับตวามจำของคุณ?'
      }
    ],
    Sadness: [
      {
        id: 'sadness_1',
        question: 'คุณรู้สึกเศร้าเมื่อนึกไม่ออกมากแค่ไหน?'
      },
      {
        id: 'sadness_2',
        question: 'การจำไม่ได้ส่งผลต่อความรู้สึกของคุณอย่างไร?'
      }
    ],
    Disgust: [
      {
        id: 'disgust_1',
        question: 'คุณรู้สึกไม่พอใจกับตัวเองเมื่อจำไม่ได้หรือไม่?'
      },
      {
        id: 'disgust_2',
        question: 'มีสิ่งใดทีทำให้คุณรู้สึกรำคาญเกี่ยวกับความจำของคุณ?'
      }
    ],
    Anger: [
      {
        id: 'anger_1',
        question: 'คุณรู้สึกโกรธหรือหงุดหงิดเมื่อจำไม่ได้หรือไม่?'
      },
      {
        id: 'anger_2',
        question: 'อะไรที่ทำให้คุณรู้สึกโมโหเกี่ยวกับความจำของคุณ?'
      }
    ],
    Anticipation: [
      {
        id: 'anticipation_1',
        question: 'คุณคาดหวังว่าจะสามารถจำได้ดีขึ้นหรือไม่?'
      },
      {
        id: 'anticipation_2',
        question: 'คุณวางแผนจะพัฒนาความจำของคุณอย่างไร?'
      }
    ]
  };

  const emotion = req.params.emotion;
  const questions = emotionQuestions[emotion] || [];
  res.json(questions);
});

module.exports = router;