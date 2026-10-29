import {
  AccountingRevenue,
  AccountingExpenseItem,
  StaffExpenseReport,
  ExpenseCategory,
  ExpenseBudget,
  AccountingMacroArea,
  RevenueSubArea,
} from '../../../types';

export const OFFICIAL_BUDGET_MENUS: ExpenseBudget[] = [
  'Preschool',
  'Community',
  'General',
  'Outreach',
  'Recycle',
];

export const OFFICIAL_BUDGET_CATEGORIES: ExpenseCategory[] = [
  "Translator's transportation",
  'ESF - AM Training',
  'Internet',
  'Mobile phone',
  'Arabic classes',
  'Computer',
  'Toner',
  'Ink for printer',
  'Electricity area TG / Volunteers houses',
  'Cleaning Supplies',
  'Maintenance Area TG / Volunteers houses',
  'Expenses and additional costs (General)',
  'Flowers and Trees',
  'Tools and equipment',
  'Gasoline (Motorcycle)',
  'Diesel (Loader)',
  'Maintenance (Loader and Motorcycle)',
  'Painting Supplies',
  'Expenses and additional costs (Recycle)',
  'Preschool Materials (books and educatio',
  'School supplements / cleaning',
  'Staff training',
  'Expenses and additional costs (Preschoo',
  'Books and materials - English',
  'Supplies for Soccer class / GYM',
  'Worker',
  'Expenses and additional costs (Communi',
  'Events, Outreach, and church planting act',
  'Volunteers Outreach',
];

// Dados reais da Planilha Excel Think Green (image_813704e7.png)
export const INITIAL_EXPENSE_ITEMS: AccountingExpenseItem[] = [
  {
    id: 'exp_1',
    receiptNumber: 1,
    date: '28/10/2025',
    product: 'Canva Pro - Monthly Graphic Design',
    price: 99.99,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
  },
  {
    id: 'exp_2',
    receiptNumber: 2,
    date: '28/11/2025',
    product: 'Canva Pro - Monthly Graphic Design',
    price: 99.99,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
  },
  {
    id: 'exp_3',
    receiptNumber: 3,
    date: '05/12/2025',
    product: 'Transportation to the airport (Rony)',
    price: 1900.0,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
  },
  {
    id: 'exp_4',
    receiptNumber: 4,
    date: '07/12/2025',
    product: 'Christmas party preschool',
    price: 840.0,
    budget: 'Preschool',
    category: 'Expenses and additional costs (Preschoo',
  },
  {
    id: 'exp_5',
    receiptNumber: 5,
    date: '08/12/2025',
    product: 'Grass Worker',
    price: 250.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_6',
    receiptNumber: 6,
    date: '08/12/2025',
    product: 'Cleaning Cesspool',
    price: 750.0,
    budget: 'General',
    category: 'Maintenance Area TG / Volunteers houses',
  },
  {
    id: 'exp_7',
    receiptNumber: 7,
    date: '09/12/2025',
    product: 'Diesel Loader',
    price: 1000.0,
    budget: 'Recycle',
    category: 'Diesel (Loader)',
  },
  {
    id: 'exp_8',
    receiptNumber: 8,
    date: '10/12/2025',
    product: 'Maintenance Motorcycle',
    price: 560.0,
    budget: 'Recycle',
    category: 'Maintenance (Loader and Motorcycle)',
  },
  {
    id: 'exp_9',
    receiptNumber: 9,
    date: '11/12/2025',
    product: 'Cleaner',
    price: 500.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_10',
    receiptNumber: 10,
    date: '11/12/2025',
    product: 'End of year parties English classes',
    price: 2600.0,
    budget: 'Community',
    category: 'Expenses and additional costs (Communi',
  },
  {
    id: 'exp_11',
    receiptNumber: 11,
    date: '11/12/2025',
    product: 'Gasoline',
    price: 300.0,
    budget: 'Recycle',
    category: 'Gasoline (Motorcycle)',
  },
  {
    id: 'exp_12',
    receiptNumber: 12,
    date: '13/12/2025',
    product: 'Transportation to the airport (Rafael)',
    price: 1200.0,
    budget: 'Community',
    category: 'Expenses and additional costs (Communi',
  },
  {
    id: 'exp_13',
    receiptNumber: 13,
    date: '14/12/2025',
    product: 'Electricity area TG',
    price: 1000.0,
    budget: 'General',
    category: 'Electricity area TG / Volunteers houses',
  },
  {
    id: 'exp_14',
    receiptNumber: 14,
    date: '15/12/2025',
    product: 'Internet Staff Room',
    price: 1750.0,
    budget: 'General',
    category: 'Internet',
  },
  {
    id: 'exp_15',
    receiptNumber: 15,
    date: '15/12/2025',
    product: 'Grass Worker',
    price: 250.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_16',
    receiptNumber: 16,
    date: '15/12/2025',
    product: 'Transportation to the airport (Jhoana)',
    price: 1200.0,
    budget: 'Preschool',
    category: 'Expenses and additional costs (Preschoo',
  },
  {
    id: 'exp_17',
    receiptNumber: 17,
    date: '17/12/2025',
    product: 'Transportation to the airport (Nicolas)',
    price: 700.0,
    budget: 'Community',
    category: 'Expenses and additional costs (Communi',
  },
  {
    id: 'exp_18',
    receiptNumber: 18,
    date: '18/12/2025',
    product: 'Transportation to the airport (Fran)',
    price: 1200.0,
    budget: 'Preschool',
    category: 'Expenses and additional costs (Preschoo',
  },
  {
    id: 'exp_19',
    receiptNumber: 19,
    date: '18/12/2025',
    product: 'Transportation to the airport (Bianca and Luana)',
    price: 1350.0,
    budget: 'Community',
    category: 'Expenses and additional costs (Communi',
  },
  {
    id: 'exp_20',
    receiptNumber: 20,
    date: '19/12/2025',
    product: 'Cleaner',
    price: 500.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_21',
    receiptNumber: 21,
    date: '22/12/2025',
    product: 'Grass Worker',
    price: 500.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_22',
    receiptNumber: 22,
    date: '25/12/2025',
    product: 'Plumber Supplies',
    price: 580.0,
    budget: 'General',
    category: 'Maintenance Area TG / Volunteers houses',
  },
  {
    id: 'exp_23',
    receiptNumber: 23,
    date: '28/12/2025',
    product: 'Canva Pro - Monthly Graphic Design',
    price: 99.99,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
  },
  {
    id: 'exp_24',
    receiptNumber: 24,
    date: '29/12/2025',
    product: 'Cleaning Supplies',
    price: 73.0,
    budget: 'General',
    category: 'Cleaning Supplies',
  },
  {
    id: 'exp_25',
    receiptNumber: 25,
    date: '29/12/2025',
    product: 'Grass Worker',
    price: 250.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_26',
    receiptNumber: 26,
    date: '31/12/2025',
    product: "Translator's transportation",
    price: 350.0,
    budget: 'General',
    category: "Translator's transportation",
  },
  {
    id: 'exp_27',
    receiptNumber: 27,
    date: '04/01/2026',
    product: 'Maintenance Glass',
    price: 2200.0,
    budget: 'General',
    category: 'Maintenance Area TG / Volunteers houses',
  },
  {
    id: 'exp_28',
    receiptNumber: 28,
    date: '05/01/2026',
    product: 'Maintenance Security system',
    price: 640.0,
    budget: 'General',
    category: 'Electricity area TG / Volunteers houses',
  },
  {
    id: 'exp_29',
    receiptNumber: 29,
    date: '05/01/2026',
    product: 'Grass Worker',
    price: 500.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_30',
    receiptNumber: 30,
    date: '05/01/2026',
    product: 'Plumber Supplies',
    price: 70.0,
    budget: 'General',
    category: 'Maintenance Area TG / Volunteers houses',
  },
  {
    id: 'exp_31',
    receiptNumber: 31,
    date: '07/01/2026',
    product: 'Tools',
    price: 350.0,
    budget: 'Recycle',
    category: 'Tools and equipment',
  },
  {
    id: 'exp_32',
    receiptNumber: 32,
    date: '07/01/2026',
    product: 'Food for new volunteers welcome (Reembolso: Rafael Silveira)',
    price: 1760.0,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
    paidTo: 'Rafael Silveira',
    sourceReportId: 'rep_1',
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa81781b?w=600&auto=format&fit=crop&q=80',
    notes: 'Aprovado a partir do Relatório EXP-2026-001 (Chegada Novos Voluntários)',
  },
  {
    id: 'exp_33',
    receiptNumber: 33,
    date: '08/01/2026',
    product: 'Cleaner',
    price: 500.0,
    budget: 'Community',
    category: 'Worker',
  },
  {
    id: 'exp_34',
    receiptNumber: 34,
    date: '08/01/2026',
    product: 'Transportation from airport (Eser, Gabrielly, Mariana) (Reembolso: Rafael Silveira)',
    price: 1800.0,
    budget: 'Community',
    category: 'Expenses and additional costs (Communi',
    paidTo: 'Rafael Silveira',
    sourceReportId: 'rep_1',
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa81781b?w=600&auto=format&fit=crop&q=80',
    notes: 'Aprovado a partir do Relatório EXP-2026-001 (Chegada Novos Voluntários)',
  },
  {
    id: 'exp_35',
    receiptNumber: 35,
    date: '08/01/2026',
    product: 'Transportation from airport (Gabriel, Brenda, Marcela)',
    price: 1800.0,
    budget: 'Community',
    category: 'Expenses and additional costs (Communi',
  },
  {
    id: 'exp_36',
    receiptNumber: 36,
    date: '08/01/2026',
    product: 'Food for volunteers',
    price: 1370.0,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
  },
  {
    id: 'exp_37',
    receiptNumber: 37,
    date: '08/01/2026',
    product: 'Sim Card Volunteer (Reembolso: Rafael Silveira)',
    price: 112.56,
    budget: 'General',
    category: 'Expenses and additional costs (General)',
    paidTo: 'Rafael Silveira',
    sourceReportId: 'rep_1',
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa81781b?w=600&auto=format&fit=crop&q=80',
    notes: 'Aprovado a partir do Relatório EXP-2026-001 (Chegada Novos Voluntários)',
  },
  {
    id: 'exp_38',
    receiptNumber: 38,
    date: '09/01/2026',
    product: 'Diesel Loader',
    price: 1000.0,
    budget: 'Recycle',
    category: 'Diesel (Loader)',
  },
  {
    id: 'exp_39',
    receiptNumber: 39,
    date: '11/01/2026',
    product: "Books English Classes (Reembolso: Professor Lucas Silva)",
    price: 15550.0,
    budget: 'Community',
    category: 'Books and materials - English',
    paidTo: 'Professor Lucas Silva (Coordenação de Inglês)',
    sourceReportId: 'rep_2',
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    notes: "Aprovado a partir do Relatório EXP-2026-002 (Compra de Livros Didáticos Let's Go)",
  },
  {
    id: 'exp_40',
    receiptNumber: 40,
    date: '11/01/2026',
    product: 'Transportation for the books (Reembolso: Professor Lucas Silva)',
    price: 450.0,
    budget: 'Community',
    category: 'Books and materials - English',
    paidTo: 'Professor Lucas Silva (Coordenação de Inglês)',
    sourceReportId: 'rep_2',
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    notes: "Aprovado a partir do Relatório EXP-2026-002 (Compra de Livros Didáticos Let's Go)",
  },
  {
    id: 'exp_41',
    receiptNumber: 41,
    date: '11/01/2026',
    product: 'Electricity area TG',
    price: 1000.0,
    budget: 'General',
    category: 'Electricity area TG / Volunteers houses',
  },
  {
    id: 'exp_42',
    receiptNumber: 42,
    date: '11/01/2026',
    product: "Mirror for volunteer's house",
    price: 1200.0,
    budget: 'General',
    category: 'Maintenance Area TG / Volunteers houses',
  },
  {
    id: 'exp_43',
    receiptNumber: 43,
    date: '11/01/2026',
    product: 'Silicone',
    price: 70.0,
    budget: 'General',
    category: 'Maintenance Area TG / Volunteers houses',
  },
];

// Recebimentos Iniciais (Áreas: Lixo, Pré-Escola, Centro Comunitário)
export const INITIAL_ACCOUNTING_REVENUES: AccountingRevenue[] = [
  // 1. CENTRO COMUNITÁRIO — CURSO LIVRE DE INGLÊS (Adolescentes: 2000 a cada 3 meses; Crianças: 4 meses)
  {
    id: 'rev_eng_1',
    receiptNumber: 'REC-2026-0101',
    date: '2026-02-10',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'CURSO_INGLES',
    title: 'Curso Livre de Inglês — Parcela 1/3 (Adolescente)',
    description: 'Nível Teen B1 — Aluno Youssef Mansour. Ciclo trimestral regular.',
    amount: 2000.0,
    payerName: 'Youssef Mansour',
    installmentsInfo: 'Parcela 1 de 3 (Ciclo Trimestral)',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-10 10:15',
  },
  {
    id: 'rev_eng_2',
    receiptNumber: 'REC-2026-0102',
    date: '2026-02-12',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'CURSO_INGLES',
    title: 'Curso Livre de Inglês — Parcela 1/4 (Criança)',
    description: 'Nível Let\'s Go Kids 1 — Aluna Farida Hassan. Ciclo de 4 meses.',
    amount: 2000.0,
    payerName: 'Hassan Mahmoud (Pai)',
    installmentsInfo: 'Parcela 1 de 4 (Kids 4 meses)',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-12 11:30',
  },
  {
    id: 'rev_eng_3',
    receiptNumber: 'REC-2026-0103',
    date: '2026-02-15',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'CURSO_INGLES',
    title: 'Curso Livre de Inglês — Parcela 2/3 (Adolescente)',
    description: 'Nível Teen A2 — Aluno Omar Tarek.',
    amount: 2000.0,
    payerName: 'Omar Tarek',
    installmentsInfo: 'Parcela 2 de 3 (Adolescentes)',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-15 14:00',
  },
  {
    id: 'rev_eng_4',
    receiptNumber: 'REC-2026-0104',
    date: '2026-03-01',
    month: '03',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'CURSO_INGLES',
    title: 'Curso Livre de Inglês — Parcela 1/3 (Adulto A1)',
    description: 'Nível Adulto A1 Noturno — Aluna Mariam El-Sayed.',
    amount: 2000.0,
    payerName: 'Mariam El-Sayed',
    installmentsInfo: 'Parcela 1 de 3 (Trimestral)',
    paymentMethod: 'TRANSFERENCIA',
    registeredBy: 'Karim Fahmy (Tesouraria)',
    status: 'CONFIRMADO',
    createdAt: '2026-03-01 09:20',
  },

  // 2. PRÉ-ESCOLA (Máximo 2 vezes ou semestral de 9.000 EGP / anual 18.000 EGP)
  {
    id: 'rev_pre_1',
    receiptNumber: 'REC-2026-0201',
    date: '2026-01-20',
    month: '01',
    year: 2026,
    macroArea: 'PRE_ESCOLA',
    subArea: 'PRE_ESCOLA',
    title: 'Pré-Escola Girassol — Semestre 1/2026',
    description: 'Matrícula e 1º semestre turma Girassol (4 a 5 anos) — Aluno Karim Zaki.',
    amount: 9000.0,
    payerName: 'Dr. Zaki Ibrahim',
    installmentsInfo: 'Semestre 1 (Parcela única de 9.000 EGP)',
    paymentMethod: 'TRANSFERENCIA',
    registeredBy: 'Mona Abdelrahman (Secretaria)',
    status: 'CONFIRMADO',
    createdAt: '2026-01-20 15:40',
  },
  {
    id: 'rev_pre_2',
    receiptNumber: 'REC-2026-0202',
    date: '2026-02-05',
    month: '02',
    year: 2026,
    macroArea: 'PRE_ESCOLA',
    subArea: 'PRE_ESCOLA',
    title: 'Pré-Escola Girassol — Semestre 1/2026',
    description: 'Matrícula e 1º semestre — Aluna Laila Mostafa.',
    amount: 9000.0,
    payerName: 'Fatma Mostafa (Mãe)',
    installmentsInfo: 'Semestre 1 (Parcela de 9.000 EGP)',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-05 10:00',
  },

  // 3. CENTRO COMUNITÁRIO — ACADEMIA & AULA DE GINÁSTICA (MESMA CATEGORIA)
  {
    id: 'rev_gym_1',
    receiptNumber: 'REC-2026-0301',
    date: '2026-02-18',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'ACADEMIA_GINASTICA',
    title: 'Academia & Circuito Funcional Feminino — Mensalidade',
    description: 'Pacote mensal matutino de ginástica e musculação para mulheres.',
    amount: 1500.0,
    payerName: 'Salma El-Badry',
    installmentsInfo: 'Mensalidade Fevereiro/2026',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-18 09:15',
  },
  {
    id: 'rev_gym_2',
    receiptNumber: 'REC-2026-0302',
    date: '2026-03-02',
    month: '03',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'ACADEMIA_GINASTICA',
    title: 'Academia & Aula de Ginástica — Mensalidade Março',
    description: 'Circuito funcional e aula aeróbica comunitária.',
    amount: 1500.0,
    payerName: 'Nouran Samir',
    installmentsInfo: 'Mensalidade Março/2026',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-03-02 16:30',
  },

  // 4. CENTRO COMUNITÁRIO — AULAS DE FUTEBOL
  {
    id: 'rev_soc_1',
    receiptNumber: 'REC-2026-0401',
    date: '2026-02-20',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'AULAS_FUTEBOL',
    title: 'Academia de Futebol Juvenil Sub-15 — Mensalidade',
    description: 'Treinos táticos e preparação física no Campo Sintético 01.',
    amount: 1200.0,
    payerName: 'Ahmed Mansour (Pai)',
    installmentsInfo: 'Mensalidade Fevereiro',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-20 18:00',
  },
  {
    id: 'rev_soc_2',
    receiptNumber: 'REC-2026-0402',
    date: '2026-03-04',
    month: '03',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'AULAS_FUTEBOL',
    title: 'Aulas de Futebol Sub-15 — Mensalidade Março',
    description: 'Atleta Youssef Mansour — 2x semana com Prof. Lucas.',
    amount: 1200.0,
    payerName: 'Ahmed Mansour',
    installmentsInfo: 'Mensalidade Março',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-03-04 18:15',
  },

  // 5. CENTRO COMUNITÁRIO — CANTINA
  {
    id: 'rev_cant_1',
    receiptNumber: 'REC-2026-0501',
    date: '2026-02-28',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'CANTINA',
    title: 'Receita Fechamento Semanal Cantina Think Green',
    description: 'Venda de lanches naturais, sucos e cafés na recepção e intervalos.',
    amount: 3450.0,
    payerName: 'Consumidores Cantina',
    installmentsInfo: 'Receita Operacional Consolidada',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-28 19:30',
  },
  {
    id: 'rev_cant_2',
    receiptNumber: 'REC-2026-0502',
    date: '2026-03-05',
    month: '03',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'CANTINA',
    title: 'Receita Semanal Cantina — Semana 1 Março',
    description: 'Bebidas, sanduíches e café da manhã dos voluntários.',
    amount: 2890.0,
    payerName: 'Caixa Cantina',
    installmentsInfo: 'Consolidado da Semana',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-03-05 18:00',
  },

  // 6. LIXO — VENDA DE LIXO / RECICLAGEM
  {
    id: 'rev_rec_1',
    receiptNumber: 'REC-2026-0601',
    date: '2026-02-14',
    month: '02',
    year: 2026,
    macroArea: 'LIXO',
    subArea: 'VENDA_LIXO',
    title: 'Venda de Fardos de Papelão e Plástico Prensado',
    description: 'Venda de material reciclável triado e prensado da cooperativa Think Green (4,2 toneladas).',
    amount: 14800.0,
    payerName: 'Cairo Recycling Mill Co.',
    installmentsInfo: 'Lote 01/2026 — Fardos Prensados',
    paymentMethod: 'TRANSFERENCIA',
    registeredBy: 'Rony (Coordenação Geral)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-14 16:00',
  },
  {
    id: 'rev_rec_2',
    receiptNumber: 'REC-2026-0602',
    date: '2026-02-27',
    month: '02',
    year: 2026,
    macroArea: 'LIXO',
    subArea: 'VENDA_LIXO',
    title: 'Venda de Sucata Metálica e Alumínio',
    description: 'Lote de latinhas e sucata separada da coleta comunitária (1,8 toneladas).',
    amount: 9600.0,
    payerName: 'Metal Scrap Industries Egypt',
    installmentsInfo: 'Lote 02/2026 — Metais',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Rony (Coordenação Geral)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-27 15:30',
  },
  {
    id: 'rev_rec_3',
    receiptNumber: 'REC-2026-0603',
    date: '2026-03-06',
    month: '03',
    year: 2026,
    macroArea: 'LIXO',
    subArea: 'VENDA_LIXO',
    title: 'Venda de PET e PEAD Moído',
    description: '3 toneladas de flakes plásticos lavados e moídos para reprocessamento.',
    amount: 18500.0,
    payerName: 'Nile Polymers Ltd.',
    installmentsInfo: 'Lote 03/2026 — Plásticos',
    paymentMethod: 'TRANSFERENCIA',
    registeredBy: 'Rony (Coordenação Geral)',
    status: 'CONFIRMADO',
    createdAt: '2026-03-06 17:00',
  },

  // 7. CENTRO COMUNITÁRIO — ALUGUEL DE CAMPO E PING PONG
  {
    id: 'rev_rent_1',
    receiptNumber: 'REC-2026-0701',
    date: '2026-02-21',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'ALUGUEL_CAMPO_PINGPONG',
    title: 'Locação Campo Sintético — Torneio Comunitário Noturno',
    description: 'Locação do campo com iluminação de refletores (4 horas — Sábado à noite).',
    amount: 2400.0,
    payerName: 'Liga Amadora de Futebol do Cairo',
    installmentsInfo: '4 horas @ 600 EGP/hora',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-21 21:00',
  },
  {
    id: 'rev_rent_2',
    receiptNumber: 'REC-2026-0702',
    date: '2026-02-22',
    month: '02',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'ALUGUEL_CAMPO_PINGPONG',
    title: 'Locação de Mesas de Ping Pong & Raquetes (Fim de Semana)',
    description: 'Pacote de 6 horas de uso das mesas profissionais no salão de jogos.',
    amount: 600.0,
    payerName: 'Grupo Comunitário Jovens Think Green',
    installmentsInfo: '6 horas de Ping Pong',
    paymentMethod: 'DINHEIRO',
    registeredBy: 'Yasmin Nour (Recepção)',
    status: 'CONFIRMADO',
    createdAt: '2026-02-22 17:00',
  },

  // 8. CENTRO COMUNITÁRIO — SUMMER CAMPING
  {
    id: 'rev_camp_1',
    receiptNumber: 'REC-2026-0801',
    date: '2026-03-02',
    month: '03',
    year: 2026,
    macroArea: 'CENTRO_COMUNITARIO',
    subArea: 'SUMMER_CAMPING',
    title: 'Inscrições Antecipadas — Summer Camping Think Green 2026',
    description: 'Lote promocional de 5 crianças para a colônia de férias ecológica de Julho.',
    amount: 7500.0,
    payerName: 'Famílias Bairro Nasr City',
    installmentsInfo: '5 inscrições x 1.500 EGP',
    paymentMethod: 'TRANSFERENCIA',
    registeredBy: 'Karim Fahmy (Tesouraria)',
    status: 'CONFIRMADO',
    createdAt: '2026-03-02 12:00',
  },
];

// Relatórios de Reembolso Enviados por Colaboradores (Template Expense Report PDF)
export const INITIAL_EXPENSE_REPORTS: StaffExpenseReport[] = [
  {
    id: 'rep_1',
    reportCode: 'EXP-2026-001',
    userId: 'user_vol_1',
    fullName: 'Rafael Silveira (Voluntário Comunitário)',
    userEmail: 'rafael.voluntario@thinkgreen.org',
    event: 'Acolhimento de Voluntários & Translado Aeroporto do Cairo',
    date: '08/01/2026',
    items: [
      {
        id: 'item_1a',
        category: 'Expenses and additional costs (General)',
        description: 'Alimentação de boas-vindas dos novos voluntários internacionais',
        date: '07/01/2026',
        amount: 1760.0,
      },
      {
        id: 'item_1b',
        category: 'Expenses and additional costs (Communi',
        description: 'Translado van aeroporto Cairo (Eser, Gabrielly, Mariana)',
        date: '08/01/2026',
        amount: 1800.0,
      },
      {
        id: 'item_1c',
        category: 'Expenses and additional costs (General)',
        description: 'Chips de telefonia local (Sim Cards) para voluntários',
        date: '08/01/2026',
        amount: 112.56,
      },
    ],
    totalAmount: 3672.56,
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa81781b?w=600&auto=format&fit=crop&q=80',
    signatureName: 'Rafael Silveira',
    status: 'APROVADO',
    reviewedBy: 'Rony (Contabilidade)',
    reviewedAt: '2026-01-09 14:30',
    reviewNotes: 'Comprovantes conferidos e despesas integradas à planilha oficial (Recibos #32, #34, #37). Reembolso efetuado em dinheiro físico.',
    assignedExpenseReceipts: [32, 34, 37],
    createdAt: '2026-01-08 18:20',
  },
  {
    id: 'rep_2',
    reportCode: 'EXP-2026-002',
    userId: 'user_teacher_1',
    fullName: 'Professor Lucas Silva (Coordenação de Inglês)',
    userEmail: 'lucas.professor@thinkgreen.org',
    event: 'Compra de Livros Didáticos Let\'s Go & Material das Turmas',
    date: '11/01/2026',
    items: [
      {
        id: 'item_2a',
        category: 'Books and materials - English',
        description: 'Lote de livros Let\'s Go 1 e apostilas de exercícios',
        date: '11/01/2026',
        amount: 15550.0,
      },
      {
        id: 'item_2b',
        category: 'Books and materials - English',
        description: 'Transporte e frete das caixas de livros da gráfica até o centro',
        date: '11/01/2026',
        amount: 450.0,
      },
    ],
    totalAmount: 16000.0,
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    signatureName: 'Lucas Silva',
    status: 'APROVADO',
    reviewedBy: 'Rony (Contabilidade)',
    reviewedAt: '2026-01-12 11:00',
    reviewNotes: 'Livros conferidos fisicamente na biblioteca e integrados à planilha oficial (Recibos #39 e #40).',
    assignedExpenseReceipts: [39, 40],
    createdAt: '2026-01-11 16:45',
  },
  {
    id: 'rep_3',
    reportCode: 'EXP-2026-003',
    userId: 'user_vol_2',
    fullName: 'Jhoana Morales (Equipe Pré-Escola Girassol)',
    userEmail: 'jhoana.morales@thinkgreen.org',
    event: 'Materiais Pedagógicos & Reparos na Sala dos Voluntários',
    date: '25/02/2026',
    items: [
      {
        id: 'item_3a',
        category: 'Preschool Materials (books and educatio',
        description: 'Cartolinas coloridas, colas atóxicas e pincéis para a Turma Girassol',
        date: '22/02/2026',
        amount: 850.0,
      },
      {
        id: 'item_3b',
        category: 'Maintenance Area TG / Volunteers houses',
        description: 'Lâmpadas de LED e reparo de tomada no alojamento dos voluntários',
        date: '24/02/2026',
        amount: 420.0,
      },
      {
        id: 'item_3c',
        category: 'Cleaning Supplies',
        description: 'Desinfetantes e panos de microfibra para sanitização das salas infantis',
        date: '25/02/2026',
        amount: 280.0,
      },
    ],
    totalAmount: 1550.0,
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa81781b?w=600&auto=format&fit=crop&q=80',
    signatureName: 'Jhoana Morales',
    status: 'PENDENTE',
    createdAt: '2026-02-25 18:30',
  },
  {
    id: 'rep_4',
    reportCode: 'EXP-2026-004',
    userId: 'user_worker_1',
    fullName: 'Mahmoud Al-Sayed (Operações & Manutenção)',
    userEmail: 'mahmoud.operacoes@thinkgreen.org',
    event: 'Combustível e Troca de Filtro da Pá Carregadeira (Recycle)',
    date: '02/03/2026',
    items: [
      {
        id: 'item_4a',
        category: 'Diesel (Loader)',
        description: 'Abastecimento de diesel para a máquina pá carregadeira de recicláveis',
        date: '01/03/2026',
        amount: 1000.0,
      },
      {
        id: 'item_4b',
        category: 'Maintenance (Loader and Motorcycle)',
        description: 'Filtro de óleo e graxa de vedação para os braços hidráulicos',
        date: '02/03/2026',
        amount: 650.0,
      },
    ],
    totalAmount: 1650.0,
    receiptPhotoUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    signatureName: 'Mahmoud Al-Sayed',
    status: 'PENDENTE',
    createdAt: '2026-03-02 14:10',
  },
];

// Storage keys
const ACCOUNTING_REVENUES_STORAGE_KEY = 'think_green_accounting_revenues_v1';
const ACCOUNTING_EXPENSES_STORAGE_KEY = 'think_green_accounting_expenses_v1';
const EXPENSE_REPORTS_STORAGE_KEY = 'think_green_expense_reports_v1';

export function getStoredAccountingRevenues(): AccountingRevenue[] {
  try {
    const raw = localStorage.getItem(ACCOUNTING_REVENUES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTING_REVENUES_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTING_REVENUES));
      return INITIAL_ACCOUNTING_REVENUES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ACCOUNTING_REVENUES;
  }
}

export function saveStoredAccountingRevenues(revenues: AccountingRevenue[]) {
  try {
    localStorage.setItem(ACCOUNTING_REVENUES_STORAGE_KEY, JSON.stringify(revenues));
  } catch (e) {
    console.error('Error saving accounting revenues:', e);
  }
}

export function getStoredAccountingExpenses(): AccountingExpenseItem[] {
  try {
    const raw = localStorage.getItem(ACCOUNTING_EXPENSES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTING_EXPENSES_STORAGE_KEY, JSON.stringify(INITIAL_EXPENSE_ITEMS));
      return INITIAL_EXPENSE_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSE_ITEMS;
  }
}

export function saveStoredAccountingExpenses(expenses: AccountingExpenseItem[]) {
  try {
    localStorage.setItem(ACCOUNTING_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving accounting expenses:', e);
  }
}

export function getStoredExpenseReports(): StaffExpenseReport[] {
  try {
    const raw = localStorage.getItem(EXPENSE_REPORTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXPENSE_REPORTS_STORAGE_KEY, JSON.stringify(INITIAL_EXPENSE_REPORTS));
      return INITIAL_EXPENSE_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSE_REPORTS;
  }
}

export function saveStoredExpenseReports(reports: StaffExpenseReport[]) {
  try {
    localStorage.setItem(EXPENSE_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving expense reports:', e);
  }
}

/**
 * Formata qualquer data para DD/MM/YYYY padrão da Planilha de Gastos Excel
 */
export function formatDateToDDMMYYYY(dateStr?: string): string {
  if (!dateStr) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  }
  if (dateStr.includes('/')) return dateStr;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  return dateStr;
}

/**
 * Garante que todos os relatórios com status 'APROVADO' estejam lançados
 * na planilha oficial de despesas (expenses).
 */
export function syncApprovedReportsIntoExpenses(
  currentExpenses: AccountingExpenseItem[],
  reports: StaffExpenseReport[]
): { updatedExpenses: AccountingExpenseItem[]; updatedReports: StaffExpenseReport[]; hasChanges: boolean } {
  let hasChanges = false;
  const runningExpenses = [...currentExpenses];
  let nextReceiptNo =
    runningExpenses.length > 0
      ? Math.max(...runningExpenses.map((e) => (typeof e.receiptNumber === 'number' ? e.receiptNumber : 0))) + 1
      : 1;

  const updatedReports = reports.map((report) => {
    if (report.status !== 'APROVADO') return report;

    // Verificar se já existe algum lançamento desta solicitação na planilha de gastos
    const alreadyLinked = runningExpenses.some(
      (e) =>
        e.sourceReportId === report.id ||
        (report.assignedExpenseReceipts && report.assignedExpenseReceipts.includes(e.receiptNumber))
    );

    if (!alreadyLinked && report.items && report.items.length > 0) {
      const assignedReceipts: number[] = [];
      report.items.forEach((item) => {
        const receiptNo = nextReceiptNo++;
        assignedReceipts.push(receiptNo);

        let budget: ExpenseBudget = 'General';
        const catLower = (item.category || '').toLowerCase();
        if (catLower.includes('preschool')) budget = 'Preschool';
        else if (catLower.includes('recycle') || catLower.includes('loader')) budget = 'Recycle';
        else if (
          catLower.includes('english') ||
          catLower.includes('community') ||
          catLower.includes('soccer')
        )
          budget = 'Community';
        else if (catLower.includes('outreach')) budget = 'Outreach';

        runningExpenses.push({
          id: `exp_rep_${report.id}_${item.id}`,
          receiptNumber: receiptNo,
          date: formatDateToDDMMYYYY(item.date || report.date),
          product: `${item.description} (Reembolso: ${report.fullName})`,
          price: Number(item.amount),
          budget,
          category: item.category,
          paidTo: report.fullName,
          sourceReportId: report.id,
          receiptPhotoUrl: report.receiptPhotoUrl,
          notes: `Aprovado a partir do Relatório ${report.reportCode} (${report.event})`,
          createdAt: new Date().toISOString(),
        });
      });

      hasChanges = true;
      return {
        ...report,
        assignedExpenseReceipts: assignedReceipts,
      };
    }

    return report;
  });

  return { updatedExpenses: runningExpenses, updatedReports, hasChanges };
}

