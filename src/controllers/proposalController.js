import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProposals = async (req, res) => {
  try {
    const { id, role, affiliation } = req.user;
    let proposals;

    const include = {
      comments: {
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
    };

    switch (role) {
      case "STUDENT":
        proposals = await prisma.proposal.findMany({
          where: {
            submittedById: id,
          },
          include,
        });
        break;

      case "MENTOR":
        proposals = await prisma.proposal.findMany({
          where: {
            AND: [
              { society: affiliation },
              {
                OR: [
                  { status: "PENDING" },
                  { status: "REVISED" },
                  { status: "REJECTED" },
                  { status: "APPROVED" },
                  { nextReviewerRole: "MENTOR" },
                ],
              },
            ],
          },
          include,
        });
        break;

      case "STUDENT_AFFAIRS":
        // Student Affairs can see all proposals
        proposals = await prisma.proposal.findMany({
          include,
        });
        break;

      case "DIRECTOR":
        proposals = await prisma.proposal.findMany({
          where: {
            OR: [
              { nextReviewerRole: "DIRECTOR" },
              { status: "APPROVED" },
            ],
          },
          include,
        });
        break;

      case "FINANCE_MANAGER":
        proposals = await prisma.proposal.findMany({
          where: {
            OR: [
              { nextReviewerRole: "FINANCE_MANAGER" },
              { status: "APPROVED" },
            ],
          },
          include,
        });
        break;

      default:
        return res.status(403).json({ message: "Role not recognized" });
    }

    console.log("Fetched Proposals:", proposals); // Log the fetched proposals
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
        society: req.user.affiliation,
        venue,
        description,
        eventDate: new Date(eventDate),
        budget,
        status: "PENDING",
        submittedById: req.user.id,
        nextReviewerRole: "MENTOR",
      },
      include: {
        comments: true,
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
    const { role, id: userId } = req.user;

    const proposal = await prisma.proposal.findUnique({
      where: { id: parseInt(id) },
      include: {
        comments: true,
      },
    });

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.nextReviewerRole !== role) {
      return res.status(403).json({ message: "Not authorized to review this proposal" });
    }

    let nextReviewerRole = null;

    if (status.toUpperCase() === "APPROVED") {
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
          nextReviewerRole = null;
          break;
      }
    } else {
      nextReviewerRole = "MENTOR";
    }

    const updatedProposal = await prisma.$transaction(async (prisma) => {
      const updated = await prisma.proposal.update({
        where: { id: parseInt(id) },
        data: {
          status: status.toUpperCase(),
          reviewedById: userId,
          nextReviewerRole,
        },
        include: {
          comments: {
            include: {
              user: {
                select: {
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (comments) {
        await prisma.comment.create({
          data: {
            content: comments,
            userId: userId,
            proposalId: parseInt(id),
          },
        });
      }

      return updated;
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error("Error reviewing proposal:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};