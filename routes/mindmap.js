const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MindMap = require('../models/MindMap');

// Get mind map for a user
router.get('/:nationalId', async (req, res) => {
  try {
    let mindMap = await MindMap.findOne({ nationalId: req.params.nationalId });
    
    if (!mindMap) {
      // If no mind map exists, create a new one with default root node
      mindMap = new MindMap({
        nationalId: req.params.nationalId,
        root: {
          _id: new mongoose.Types.ObjectId(),
          content: 'หัวข้อหลัก',
          children: [],
          isExpanded: true
        }
      });
      await mindMap.save();
    }
    
    res.json(mindMap);
  } catch (error) {
    console.error('Error fetching mind map:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new node
router.post('/add-node', async (req, res) => {
  try {
    const { nationalId, parentId, content } = req.body;
    
    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    const parentNode = mindMap.findNodeById(parentId);
    if (!parentNode) {
      return res.status(404).json({ error: 'Parent node not found' });
    }

    const newNode = {
      _id: new mongoose.Types.ObjectId(),
      content,
      children: [],
      isExpanded: true
    };

    parentNode.children = parentNode.children || [];
    parentNode.children.push(newNode);
    
    await mindMap.save();
    res.json(newNode);
  } catch (error) {
    console.error('Error adding node:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update node content
router.post('/update-node', async (req, res) => {
  try {
    const { nationalId, nodeId, content } = req.body;
    
    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    mindMap.updateNode(nodeId, { 
      content,
      updatedAt: new Date()
    });
    
    await mindMap.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete node
router.post('/delete-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;
    
    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    // Prevent deleting root node
    if (mindMap.root._id.toString() === nodeId) {
      return res.status(400).json({ error: 'Cannot delete root node' });
    }

    mindMap.deleteNode(nodeId);
    await mindMap.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save entire mind map structure
router.post('/save', async (req, res) => {
  try {
    const { nationalId, mindMapData } = req.body;
    
    let mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      mindMap = new MindMap({
        nationalId,
        root: mindMapData.root
      });
    } else {
      mindMap.root = mindMapData.root;
      mindMap.lastModified = new Date();
    }
    
    await mindMap.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving mind map:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export mind map
router.get('/export/:nationalId', async (req, res) => {
  try {
    const mindMap = await MindMap.findOne({ nationalId: req.params.nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    // Format the mind map data for export
    const exportData = {
      title: mindMap.root.content,
      lastModified: mindMap.lastModified,
      structure: mindMap.root
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting mind map:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import mind map
router.post('/import', async (req, res) => {
  try {
    const { nationalId, importData } = req.body;
    
    let mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      mindMap = new MindMap({ nationalId });
    }

    // Validate import data structure
    if (!importData.structure || typeof importData.structure !== 'object') {
      return res.status(400).json({ error: 'Invalid import data structure' });
    }

    // Update the mind map with imported data
    mindMap.root = importData.structure;
    mindMap.lastModified = new Date();
    
    await mindMap.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error importing mind map:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;