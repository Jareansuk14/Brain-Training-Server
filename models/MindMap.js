const mongoose = require('mongoose');

// Schema สำหรับ Node แบบแยก collection
const nodeSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  mindMapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MindMap',
    required: true
  },
  content: {
    type: String,
    required: true,
    default: 'หัวข้อใหม่'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  isExpanded: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Schema หลักสำหรับ MindMap
const mindMapSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: true,
    index: true
  },
  rootNodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node'
  }
}, {
  timestamps: true
});

const Node = mongoose.model('Node', nodeSchema);
const MindMap = mongoose.model('MindMap', mindMapSchema);

// Helper functions
async function createMindMapWithRoot(nationalId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // สร้าง MindMap ใหม่
    const mindMap = await MindMap.create([{
      nationalId
    }], { session });

    // สร้าง Root Node
    const rootNode = await Node.create([{
      mindMapId: mindMap[0]._id,
      content: 'หัวข้อหลัก',
      isRoot: true,
      parentId: null
    }], { session });

    // อัพเดต rootNodeId ใน MindMap
    mindMap[0].rootNodeId = rootNode[0]._id;
    await mindMap[0].save({ session });

    await session.commitTransaction();
    return { mindMap: mindMap[0], rootNode: rootNode[0] };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function getMindMapTree(mindMapId) {
  // ดึงข้อมูล nodes ทั้งหมดของ mindMap นี้
  const nodes = await Node.find({ mindMapId }).lean();
  
  // สร้าง map ของ nodes
  const nodesMap = new Map();
  nodes.forEach(node => {
    nodesMap.set(node._id.toString(), {
      ...node,
      children: []
    });
  });

  // สร้าง tree structure
  const tree = {
    nodes: {},
    root: null
  };

  nodes.forEach(node => {
    const nodeWithChildren = nodesMap.get(node._id.toString());
    
    if (node.isRoot) {
      tree.root = nodeWithChildren;
    } else if (node.parentId) {
      const parent = nodesMap.get(node.parentId.toString());
      if (parent) {
        parent.children.push(nodeWithChildren);
      }
    }
  });

  return tree;
}

async function addNode(mindMapId, parentId, content = 'หัวข้อใหม่') {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // หา parent node
    const parentNode = await Node.findOne({ 
      mindMapId,
      _id: parentId 
    }).session(session);

    if (!parentNode) {
      throw new Error('Parent node not found');
    }

    // สร้าง node ใหม่
    const newNode = await Node.create([{
      mindMapId,
      content,
      parentId,
      order: await Node.countDocuments({ parentId })
    }], { session });

    await session.commitTransaction();
    return newNode[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function updateNode(mindMapId, nodeId, content) {
  const node = await Node.findOneAndUpdate(
    { _id: nodeId, mindMapId },
    { content },
    { new: true }
  );
  
  if (!node) {
    throw new Error('Node not found');
  }
  
  return node;
}

async function deleteNode(mindMapId, nodeId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ไม่อนุญาตให้ลบ root node
    const node = await Node.findOne({ _id: nodeId, mindMapId }).session(session);
    if (!node || node.isRoot) {
      throw new Error('Cannot delete root node');
    }

    // ลบ node และ children ทั้งหมด
    async function deleteNodeAndChildren(nodeId) {
      const children = await Node.find({ parentId: nodeId }).session(session);
      for (const child of children) {
        await deleteNodeAndChildren(child._id);
      }
      await Node.deleteOne({ _id: nodeId }).session(session);
    }

    await deleteNodeAndChildren(nodeId);
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function toggleNode(mindMapId, nodeId) {
  const node = await Node.findOne({ _id: nodeId, mindMapId });
  if (!node) {
    throw new Error('Node not found');
  }

  node.isExpanded = !node.isExpanded;
  await node.save();
  return node;
}

module.exports = {
  MindMap,
  Node,
  createMindMapWithRoot,
  getMindMapTree,
  addNode,
  updateNode,
  deleteNode,
  toggleNode
};