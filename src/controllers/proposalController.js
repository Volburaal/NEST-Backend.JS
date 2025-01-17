import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProposals = async (req, res) => {
  try {
    const { role, affiliation } = req.user;
    console.log(affiliation);
    let proposals;

    switch (role) {
      case "STUDENT":
        proposals = await prisma.proposal.findMany({
          where: {
            society: affiliation,
          },
        });
        break;

      case "MENTOR":
        proposals = await prisma.proposal.findMany({
          where: {
            society: affiliation,
          },
        });
        break;

      case "STUDENT_AFFAIRS":
      case "DIRECTOR":
      case "FINANCE_MANAGER":
        proposals = await prisma.proposal.findMany();
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

    const proposal = await prisma.proposal.findUnique({
      where: { id: parseInt(id) },
    });

    if (!proposal)
      return res.status(404).json({ message: "Proposal not found" });

    if (proposal.nextReviewerRole !== req.user.role) {
      return res
        .status(403)
        .json({ message: "Not authorized to review this proposal" });
    }

    const nextRole = {
      MENTOR: "STUDENT_AFFAIRS",
      STUDENT_AFFAIRS: "DIRECTOR",
      DIRECTOR: "FINANCE_MANAGER",
    };

    const updatedProposal = await prisma.proposal.update({
      where: { id: parseInt(id) },
      data: {
        status: status.toUpperCase(),
        comments,
        reviewedById: req.user.id,
        nextReviewerRole:
          status.toUpperCase() === "APPROVED" ? nextRole[req.user.role] : null,
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

