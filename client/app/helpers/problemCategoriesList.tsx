import React from "react";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

interface ProblemCategory {
  id: number;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  borderColor: string;
  examples: string[];
}

export const categories: ProblemCategory[] = [
  {
    id: 1,
    title: "Academic Stress",
    description: "School, exams, grades, academic pressure",
    icon: <Ionicons name="school" size={28} color="#4a90e2" />,
    color: "#e3f2fd",
    borderColor: "#4a90e2",
    examples: [
      "Exam anxiety",
      "Poor grades",
      "Study pressure",
      "Career confusion",
    ],
  },
  {
    id: 2,
    title: "Relationships & Heartbreak",
    description: "Dating, breakups, friendship issues",
    icon: <FontAwesome5 name="heart-broken" size={28} color="#e74c3c" />,
    color: "#ffeaea",
    borderColor: "#e74c3c",
    examples: [
      "Breakups",
      "Unrequited love",
      "Friendship conflicts",
      "Dating anxiety",
    ],
  },
  {
    id: 3,
    title: "Family Issues",
    description: "Family conflicts, expectations, relationships",
    icon: <Ionicons name="home" size={28} color="#f39c12" />,
    color: "#fef9e7",
    borderColor: "#f39c12",
    examples: [
      "Parent conflicts",
      "Family expectations",
      "Sibling issues",
      "Divorce",
    ],
  },
  {
    id: 4,
    title: "Mental Health",
    description: "Anxiety, depression, stress, emotional struggles",
    icon: <Ionicons name="medical" size={28} color="#9b59b6" />,
    color: "#f4ecf7",
    borderColor: "#9b59b6",
    examples: [
      "Anxiety attacks",
      "Depression",
      "Self-esteem",
      "Panic disorders",
    ],
  },
  {
    id: 5,
    title: "Work & Career",
    description: "Job stress, workplace issues, career decisions",
    icon: <MaterialIcons name="work" size={28} color="#27ae60" />,
    color: "#e8f5e8",
    borderColor: "#27ae60",
    examples: [
      "Job interviews",
      "Workplace stress",
      "Career choices",
      "Work-life balance",
    ],
  },
  {
    id: 6,
    title: "Social Anxiety",
    description: "Social situations, making friends, confidence",
    icon: <Ionicons name="people" size={28} color="#34495e" />,
    color: "#ecf0f1",
    borderColor: "#34495e",
    examples: [
      "Making friends",
      "Social events",
      "Public speaking",
      "Loneliness",
    ],
  },
  {
    id: 7,
    title: "Identity & Self-Worth",
    description: "Self-discovery, confidence, personal growth",
    icon: <FontAwesome5 name="user-circle" size={24} color="#e67e22" />,
    color: "#fdf2e9",
    borderColor: "#e67e22",
    examples: [
      "Self-confidence",
      "Body image",
      "Personal identity",
      "Life purpose",
    ],
  },
  {
    id: 8,
    title: "Loss & Grief",
    description: "Death, loss, major life changes",
    icon: <Ionicons name="flower" size={28} color="#8e44ad" />,
    color: "#f8f4fd",
    borderColor: "#8e44ad",
    examples: [
      "Loss of loved ones",
      "Pet loss",
      "Major life changes",
      "Grief process",
    ],
  },
  {
    id: 9,
    title: "Financial Stress",
    description: "Money problems, debt, financial planning",
    icon: <MaterialIcons name="attach-money" size={28} color="#16a085" />,
    color: "#e8f8f5",
    borderColor: "#16a085",
    examples: [
      "Student debt",
      "Money management",
      "Financial planning",
      "Job loss",
    ],
  },
  {
    id: 10,
    title: "Life Transitions",
    description: "Major changes, moving, new phases of life",
    icon: <Ionicons name="compass" size={28} color="#d35400" />,
    color: "#fef5e7",
    borderColor: "#d35400",
    examples: ["Moving cities", "Graduation", "New job", "Life changes"],
  },
  {
    id: 11,
    title: "Health Issues",
    description: "Physical health, chronic illness, medical concerns",
    icon: <FontAwesome5 name="heartbeat" size={24} color="#c0392b" />,
    color: "#fdedec",
    borderColor: "#c0392b",
    examples: [
      "Chronic illness",
      "Health anxiety",
      "Medical procedures",
      "Recovery",
    ],
  },
  {
    id: 12,
    title: "General Life Support",
    description: "General venting, daily struggles, other topics",
    icon: <Ionicons name="chatbubbles" size={28} color="#7f8c8d" />,
    color: "#f8f9fa",
    borderColor: "#7f8c8d",
    examples: [
      "Daily stress",
      "General venting",
      "Life advice",
      "Other concerns",
    ],
  },
];
