/**
 * Think Green Platform - Assessment Templates & Grading Criteria
 * Based on the official Think Green assessment matrix (Adults, Teenagers, Kids)
 */

import { ClassAssessmentItem, AssessmentTemplateLevel } from '../types';

export interface AssessmentLevelTemplate {
  id: AssessmentTemplateLevel;
  name: string;
  category: 'ADULTS' | 'TEENAGERS' | 'KIDS' | 'CUSTOM';
  label: string;
  description: string;
  items: ClassAssessmentItem[];
}

export const ASSESSMENT_TEMPLATES: AssessmentLevelTemplate[] = [
  {
    id: 'ADULT_A1',
    name: 'A1',
    category: 'ADULTS',
    label: 'Adults - A1',
    description: '10% Attendance, 10% Workbook, 30% Midterm Exam, 50% Final Exam',
    items: [
      {
        id: 'a1_att',
        name: 'Attendance',
        weight: 10,
        type: 'ATTENDANCE',
        description: 'Mandatory minimum attendance and class participation',
      },
      {
        id: 'a1_wb',
        name: 'Workbook',
        weight: 10,
        type: 'WORKBOOK',
        description: 'Workbook exercises and homework tracking',
      },
      {
        id: 'a1_mid',
        name: 'Midterm Exam',
        weight: 30,
        type: 'MIDTERM',
        description: 'Mid-term exam',
      },
      {
        id: 'a1_fin',
        name: 'Final Exam',
        weight: 50,
        type: 'FINAL',
        description: 'Comprehensive final exam for level A1',
      },
    ],
  },
  {
    id: 'ADULT_A2',
    name: 'A2 & A2+',
    category: 'ADULTS',
    label: 'Adults - A2 & A2+',
    description: '5% Attendance, 15% Homework (Workbook and Classroom), 30% Midterm Exam, 50% Final Exam',
    items: [
      {
        id: 'a2_att',
        name: 'Attendance',
        weight: 5,
        type: 'ATTENDANCE',
        description: 'Regular attendance and punctuality',
      },
      {
        id: 'a2_hw',
        name: 'Homework (Workbook and Classroom)',
        weight: 15,
        type: 'HOMEWORK',
        description: 'Homework, practical exercises and classroom production',
      },
      {
        id: 'a2_mid',
        name: 'Midterm Exam',
        weight: 30,
        type: 'MIDTERM',
        description: 'Mid-semester exam',
      },
      {
        id: 'a2_fin',
        name: 'Final Exam',
        weight: 50,
        type: 'FINAL',
        description: 'Final exam for level A2 & A2+',
      },
    ],
  },
  {
    id: 'ADULT_B1',
    name: 'B1 & B1+',
    category: 'ADULTS',
    label: 'Adults - B1 & B1+',
    description: '15% Homework (Workbook and Classroom), 15% Oral Exam, 25% Midterm Exam, 45% Final Exam',
    items: [
      {
        id: 'b1_hw',
        name: 'Homework (Workbook and Classroom)',
        weight: 15,
        type: 'HOMEWORK',
        description: 'Extracurricular activities and course material tracking',
      },
      {
        id: 'b1_oral',
        name: 'Oral Exam',
        weight: 15,
        type: 'ORAL_EXAM',
        description: 'Assessment of conversation, pronunciation and communicative fluency',
      },
      {
        id: 'b1_mid',
        name: 'Midterm Exam',
        weight: 25,
        type: 'MIDTERM',
        description: 'Written and grammar mid-term exam',
      },
      {
        id: 'b1_fin',
        name: 'Final Exam',
        weight: 45,
        type: 'FINAL',
        description: 'Integrated final semester exam B1 & B1+',
      },
    ],
  },
  {
    id: 'ADULT_B2_C1',
    name: 'B2, B2+ & C1',
    category: 'ADULTS',
    label: 'Adults - B2, B2+ & C1',
    description: '15% Homework (Workbook and Classroom), 20% Oral Exam (Presentation), 25% Midterm Exam, 40% Final Exam',
    items: [
      {
        id: 'b2_hw',
        name: 'Homework (Workbook and Classroom)',
        weight: 15,
        type: 'HOMEWORK',
        description: 'Essays, argumentative writing and advanced exercises',
      },
      {
        id: 'b2_oral',
        name: 'Oral Exam (Presentation)',
        weight: 20,
        type: 'ORAL_EXAM',
        description: 'Academic thematic oral presentation and formal debate',
      },
      {
        id: 'b2_mid',
        name: 'Midterm Exam',
        weight: 25,
        type: 'MIDTERM',
        description: 'Advanced written mid-term exam',
      },
      {
        id: 'b2_fin',
        name: 'Final Exam',
        weight: 40,
        type: 'FINAL',
        description: 'Proficiency and language mastery exam',
      },
    ],
  },
  {
    id: 'TEENAGERS',
    name: 'Teenagers Levels',
    category: 'TEENAGERS',
    label: 'Teenagers Levels',
    description: '10% Attendance, 10% Workbook, 30% Midterm, 40% Final Term (10% adjustable margin)',
    items: [
      {
        id: 'teen_att',
        name: 'ATTENDANCE',
        weight: 10,
        type: 'ATTENDANCE',
        description: 'Regular attendance and engagement of teenagers',
      },
      {
        id: 'teen_wb',
        name: 'WORKBOOK',
        weight: 10,
        type: 'WORKBOOK',
        description: 'Practical exercises from the course material',
      },
      {
        id: 'teen_mid',
        name: 'MIDTERM',
        weight: 30,
        type: 'MIDTERM',
        description: 'Mid-year/semester exam',
      },
      {
        id: 'teen_fin',
        name: 'FINAL TERM',
        weight: 50, // default rounded to 100% or 40% as in prompt; allows editing
        type: 'FINAL',
        description: 'Final exam completing the teenager cycle',
      },
    ],
  },
  {
    id: 'KIDS_LB_LG',
    name: 'Kids Levels (LB1, LB2, LG1, LG2, LG3, LG4, LG5, LG6)',
    category: 'KIDS',
    label: 'Kids Levels (LB1..LG6)',
    description: '10% Attendance, 10% Workbook, 10% Unit Tests (8 Unit Tests = 1.25% each), 30% Midterm, 40% Final Term',
    items: [
      {
        id: 'kids_att',
        name: 'ATTENDANCE',
        weight: 10,
        type: 'ATTENDANCE',
        description: 'Playful attendance and positive participation in class',
      },
      {
        id: 'kids_wb',
        name: 'WORKBOOK',
        weight: 10,
        type: 'WORKBOOK',
        description: 'Activity book and educational drawings',
      },
      {
        id: 'kids_ut',
        name: 'UNIT TESTS (8 Unit Tests = 1.25% each one)',
        weight: 10,
        type: 'UNIT_TESTS',
        description: '8 unit tests worth 1.25% each (Total: 10%)',
        unitTestsCount: 8,
        unitTestWeightEach: 1.25,
      },
      {
        id: 'kids_mid',
        name: 'MIDTERM',
        weight: 30,
        type: 'MIDTERM',
        description: 'Kids mid-term assessment',
      },
      {
        id: 'kids_fin',
        name: 'FINAL TERM',
        weight: 40,
        type: 'FINAL',
        description: 'Playful and interactive final exam',
      },
    ],
  },
  {
    id: 'CUSTOM',
    name: 'Custom',
    category: 'CUSTOM',
    label: 'Custom (Sports / Preschool / Fitness)',
    description: 'Flexible configuration defined by the Pedagogical Coordination',
    items: [
      {
        id: 'cust_part',
        name: 'Participation & Attendance',
        weight: 20,
        type: 'ATTENDANCE',
        description: 'Attendance and practical engagement',
      },
      {
        id: 'cust_hw',
        name: 'Continuous Practical Activities',
        weight: 30,
        type: 'HOMEWORK',
        description: 'Exercises, drills and applied activities',
      },
      {
        id: 'cust_mid',
        name: 'Mid-term Assessment',
        weight: 20,
        type: 'MIDTERM',
        description: 'Practical mid-term test or exam',
      },
      {
        id: 'cust_fin',
        name: 'Final / Conclusive Assessment',
        weight: 30,
        type: 'FINAL',
        description: 'Final exam or demonstration of skills',
      },
    ],
  },
];

export const getAssessmentTemplate = (id: AssessmentTemplateLevel): AssessmentLevelTemplate => {
  const found = ASSESSMENT_TEMPLATES.find((t) => t.id === id);
  return found || ASSESSMENT_TEMPLATES[0];
};

export const getDefaultAssessmentConfig = (id: AssessmentTemplateLevel): ClassAssessmentItem[] => {
  const tmpl = getAssessmentTemplate(id);
  return JSON.parse(JSON.stringify(tmpl.items));
};

export const calculateTotalWeight = (items?: ClassAssessmentItem[]): number => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);
};

/**
 * Automatically generates the standard class code without a random field.
 * Standard format: [PREFIX]-[LEVEL/CODE]-[YEAR]-T[SEQ] (e.g. ENG-A1-2026-T1)
 */
export const autoGenerateClassCode = (
  courseCategoryOrCode: string,
  levelOrName: string,
  existingClasses: { code: string }[]
): string => {
  const year = new Date().getFullYear();
  let prefix = 'CLS';

  const catUpper = (courseCategoryOrCode || '').toUpperCase();
  if (catUpper.includes('ENG') || catUpper.includes('INGL')) prefix = 'ENG';
  else if (catUpper.includes('FOOT') || catUpper.includes('SPO') || catUpper.includes('FUT')) prefix = 'SPO';
  else if (catUpper.includes('PRE')) prefix = 'PRE';
  else if (catUpper.includes('WOM') || catUpper.includes('FIT')) prefix = 'FIT';
  else if (catUpper.length >= 3) prefix = catUpper.substring(0, 3);

  let lvlToken = '';
  const lvlUpper = (levelOrName || '').toUpperCase();
  if (lvlUpper.includes('A1')) lvlToken = 'A1';
  else if (lvlUpper.includes('A2')) lvlToken = 'A2';
  else if (lvlUpper.includes('B1')) lvlToken = 'B1';
  else if (lvlUpper.includes('B2') || lvlUpper.includes('C1')) lvlToken = 'B2';
  else if (lvlUpper.includes('TEEN')) lvlToken = 'TEEN';
  else if (lvlUpper.includes('KID') || lvlUpper.includes('LG') || lvlUpper.includes('LB')) lvlToken = 'KIDS';
  else if (lvlUpper.includes('INIC') || lvlUpper.includes('BEG')) lvlToken = 'INI';
  else if (lvlUpper.includes('AVAN') || lvlUpper.includes('ADV')) lvlToken = 'ADV';
  else lvlToken = 'GEN';

  const basePattern = `${prefix}-${lvlToken}-${year}`;

  // Find next sequential number
  let maxSeq = 0;
  existingClasses.forEach((c) => {
    if (c.code && c.code.startsWith(basePattern)) {
      const match = c.code.match(/-T(\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  return `${basePattern}-T${nextSeq}`;
};
