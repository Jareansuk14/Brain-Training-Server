const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MindMap = require('../models/MindMap');

// ดึงข้อมูล mind map
router.get('/:nationalId', async (req, res) => {
  try {
    console.log('Fetching mindmap for nationalId:', req.params.nationalId);
    
    let mindMap = await MindMap.findOne({ nationalId: req.params.nationalId });
    
    if (!mindMap) {
      // สร้าง mind map ใหม่ถ้ายังไม่มี
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
    
    console.log('Found/Created mindmap:', mindMap);
    res.json(mindMap);
  } catch (error) {
    console.error('Error in GET /:nationalId:', error);
    res.status(500).json({ error: error.message });
  }
});

// เพิ่ม node ใหม่
router.post('/add-child', async (req, res) => {
  try {
    const { nationalId, parentId, content } = req.body;
    console.log('Adding child node:', { nationalId, parentId, content });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    const newNode = {
      _id: new mongoose.Types.ObjectId(),
      content,
      children: [],
      isExpanded: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { node: parentNode } = mindMap.findNodeById(parentId);
    if (!parentNode) {
      return res.status(404).json({ error: 'Parent node not found' });
    }

    if (!parentNode.children) {
      parentNode.children = [];
    }
    parentNode.children.push(newNode);
    mindMap.lastModified = new Date();

    await mindMap.save();
    console.log('Added new node successfully:', newNode);
    res.json(newNode);
  } catch (error) {
    console.error('Error in POST /add-child:', error);
    res.status(500).json({ error: error.message });
  }
});

// บันทึก mind map ทั้งหมด
router.post('/save-full', async (req, res) => {
  try {
    const { nationalId, root } = req.body;
    console.log('Saving full mindmap for:', nationalId);

    const processNode = (node) => {
      return {
        _id: node._id || new mongoose.Types.ObjectId(),
        content: node.content,
        isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
        children: Array.isArray(node.children) ? node.children.map(processNode) : [],
        updatedAt: new Date()
      };
    };

    let mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      mindMap = new MindMap({ nationalId });
    }

    mindMap.root = processNode(root);
    mindMap.lastModified = new Date();
    await mindMap.save();

    console.log('Saved full mindmap successfully');
    res.json({ success: true, mindMap });
  } catch (error) {
    console.error('Error in POST /save-full:', error);
    res.status(500).json({ error: error.message });
  }
});

// อัพเดท node
router.post('/update-node', async (req, res) => {
  try {
    const { nationalId, nodeId, content } = req.body;
    console.log('Updating node:', { nationalId, nodeId, content });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    const updated = mindMap.updateNode(nodeId, { content });
    if (!updated) {
      return res.status(404).json({ error: 'Node not found' });
    }

    await mindMap.save();
    console.log('Updated node successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /update-node:', error);
    res.status(500).json({ error: error.message });
  }
});

// ลบ node
router.post('/delete-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;
    console.log('Deleting node:', { nationalId, nodeId });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    const deleted = mindMap.deleteNode(nodeId);
    if (!deleted) {
      return res.status(404).json({ error: 'Node not found or cannot be deleted' });
    }

    await mindMap.save();
    console.log('Deleted node successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /delete-node:', error);
    res.status(500).json({ error: error.message });
  }
});

// บันทึก mind map ทั้งหมด
router.post('/save', async (req, res) => {
  try {
    const { nationalId, root } = req.body;
    console.log('Saving entire mindmap for:', nationalId);

    // Function to ensure all nodes have proper _id
    const processNode = (node) => {
      const processedNode = {
        _id: node._id || new mongoose.Types.ObjectId(),
        content: node.content,
        isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
        children: Array.isArray(node.children) ? node.children.map(processNode) : [],
        updatedAt: new Date()
      };
      return processedNode;
    };

    let mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      mindMap = new MindMap({ nationalId });
    }

    // Process and save the entire tree
    mindMap.root = processNode(root);
    mindMap.lastModified = new Date();
    await mindMap.save();

    console.log('Saved mindmap successfully');
    res.json({ success: true, mindMap });
  } catch (error) {
    console.error('Error in POST /save:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;