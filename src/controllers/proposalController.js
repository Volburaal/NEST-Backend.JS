import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProposals = async (req, res) => {
  try {
    const { role, affiliation } = req.user;
    let proposals;

    switch (role) {
      case "STUDENT":
        // Students can always see their society's proposals
        proposals = await prisma.proposal.findMany({
          where: {
            society: affiliation,
          },
        });
        break;

      case "MENTOR":
        // Mentors can see proposals from their society that are either:
        // 1. Pending initial review
        // 2. In revision/rejected state
        // 3. Awaiting mentor review
        proposals = await prisma.proposal.findMany({
          where: {
            AND: [
              { society: affiliation },
              {
                OR: [
                  { status: "PENDING" },
                  { status: "REVISED" },
                  { status: "REJECTED" },
                  { nextReviewerRole: "MENTOR" }
                ]
              }
            ]
          },
        });
        break;

      case "STUDENT_AFFAIRS":
        // Student Affairs can only see proposals that have been approved by Mentor
        proposals = await prisma.proposal.findMany({
          where: {
            nextReviewerRole: "STUDENT_AFFAIRS",
          },
        });
        break;

      case "DIRECTOR":
        // Director can only see proposals that have been approved by Student Affairs
        proposals = await prisma.proposal.findMany({
          where: {
            nextReviewerRole: "DIRECTOR",
          },
        });
        break;

      case "FINANCE_MANAGER":
        // Finance Manager can only see proposals that have been approved by Director
        proposals = await prisma.proposal.findMany({
          where: {
            nextReviewerRole: "FINANCE_MANAGER",
          },
        });
        break;

      default:
        return res.status(403).json({ message: "Role not recognized" });
    }

    res.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};




export const createProposal = async (req, res) => {
  try {
    const { title, description, eventDate, posters, budget, venue } = req.body;

    if (!title || !description || !eventDate || !budget || !venue) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const proposal = await prisma.proposal.create({
      data: {
        title,
        society: req.user.affiliation, // Automatically set from user's affiliation
        venue,
        description,
        eventDate: new Date(eventDate),
        budget,
        status: "PENDING",
        submittedById: req.user.id,
        nextReviewerRole: "MENTOR",
      },
    });

    res.status(201).json(proposal);
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};



export const reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const { role } = req.user;

    const proposal = await prisma.proposal.findUnique({
      where: { id: parseInt(id) },
    });

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.nextReviewerRole !== role) {
      return res.status(403).json({ message: "Not authorized to review this proposal" });
    }

    // Define the next reviewer based on current reviewer and status
    let nextReviewerRole = null;
    
    if (status.toUpperCase() === "APPROVED") {
      // If approved, move to next role in sequence
      switch (role) {
        case "MENTOR":
          nextReviewerRole = "STUDENT_AFFAIRS";
          break;
        case "STUDENT_AFFAIRS":
          nextReviewerRole = "DIRECTOR";
          break;
        case "DIRECTOR":
          nextReviewerRole = "FINANCE_MANAGER";
          break;
        case "FINANCE_MANAGER":
          nextReviewerRole = null; // End of approval chain
          break;
      }
    } else {
      // If rejected or revision requested, send back to mentor
      nextReviewerRole = "MENTOR";
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: parseInt(id) },
      data: {
        status: status.toUpperCase(),
        comments,
        reviewedById: req.user.id,
        nextReviewerRole,
      },
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error("Error reviewing proposal:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};

