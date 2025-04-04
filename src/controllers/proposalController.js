import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProposals = async (req, res) => {
  try {
    const { id, role, affiliation } = req.user;
    let proposals;

    const include = {
      submittedBy: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
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
      files: true,
    };

    switch (role) {
      case "STUDENT":
        proposals = await prisma.proposal.findMany({
          where: { submittedById: id },
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
      case "DIRECTOR":
      case "FINANCE_MANAGER":
        proposals = await prisma.proposal.findMany({
          include,
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

    if (!title || !description || !eventDate || !venue) {
      return res.status(400).json({ error: "All fields are required" });
    }
    let nextRole="MENTOR"
    if(req.user.role == "STUDENT_AFFAIRS"){
      nextRole="DIRECTOR"
    }
    

    const proposal = await prisma.proposal.create({
      data: {
        title,
        society: req.user.affiliation,
        venue,
        description,
        eventDate: new Date(eventDate),
        budget: budget !== undefined ? budget : null,
        status: "PENDING",
        submittedById: req.user.id,
        nextReviewerRole: nextRole,
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
      return res
        .status(403)
        .json({ message: "Not authorized to review this proposal" });
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

    // Get the user's details for assigning commentedByName
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true,
        assignedToStudent: true,
        assignedToFaculty: true,
        email: true,
      },
    });

    // Determine the commentedByName based on the rules
    let commentedByName = "";
    if (user.assignedToStudent === null && user.assignedToFaculty === null) {
      commentedByName = user.email;  // If both assignedToStudent and assignedToFaculty are null, use email
    } else if (user.role === "STUDENT") {
      commentedByName = user.name;  // Use name from Student if user is a student
    } else {
      commentedByName = user.name;  // Use name from Faculty if user is not a student
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

      // Create the new comment with commentedByName
      if (comments) {
        await prisma.comment.create({
          data: {
            content: comments,
            userId: userId,
            proposalId: parseInt(id),
            commentedByName: commentedByName, // Assign the determined commentedByName
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
