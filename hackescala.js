#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const { format, parseISO, isAfter, isToday, startOfDay, addDays, previousSunday, nextSunday } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const DAY_NAMES = { DOM: 0, SEG: 1, TER: 2, QUA: 3, QUI: 4, SEX: 5, SAB: 6 };

function getPreviousDayDate(dayName) {
    const d = dayName?.toUpperCase();
    if (d === 'DOM') {
        return startOfDay(previousSunday(addDays(new Date(), 1)));
    }
    const dayIndex = DAY_NAMES[d];
    if (dayIndex === undefined) return null;
    const now = new Date();
    const ref = addDays(now, 1);
    const prev = new Date(ref);
    const diff = (ref.getDay() - dayIndex + 7) % 7;
    prev.setDate(ref.getDate() - (diff === 0 ? 7 : diff));
    return startOfDay(prev);
}

function getNextDayDate(dayName) {
    const d = dayName?.toUpperCase();
    if (d === 'DOM') {
        return startOfDay(nextSunday(new Date()));
    }
    const dayIndex = DAY_NAMES[d];
    if (dayIndex === undefined) return null;
    const now = new Date();
    const ref = new Date(now);
    const diff = (dayIndex - ref.getDay() + 7) % 7;
    ref.setDate(ref.getDate() + (diff === 0 ? 7 : diff));
    return startOfDay(ref);
}

async function fetchSchedule(token) {
    const url = `https://momemtum-back-sigma.vercel.app/api/scheduled-areas/${token}/schedules/optimized?page=1&limit=50`;
    console.log(url);
    const response = await axios.get(url);
    return response.data;
}

function processSchedules(data, count = 2, fromDate = null) {
    const now = new Date();
    const refDate = fromDate || now;

    let schedules = data.data
        .map(item => ({
            ...item,
            startDate: parseISO(item.start_datetime)
        }))
        .filter(item => item.startDate.getTime() >= refDate.getTime());

    // Só exige "futuro ou hoje" quando não foi passado previousDay/nextDay
    if (!fromDate) {
        schedules = schedules.filter(item => isAfter(item.startDate, now) || isToday(item.startDate));
    }

    schedules.sort((a, b) => a.startDate - b.startDate);
    return schedules.slice(0, count);
}

function printText(schedules) {
    if (schedules.length === 0) {
        console.log("Nenhuma escala futura encontrada.");
        return;
    }

    schedules.forEach((sched, index) => {
        const formattedDate = format(sched.startDate, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
        console.log(`--- Escala ${index + 1} ---`);
        console.log(`Data: ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}`);
        
        console.log("\nEquipe:");
        sched.schedule_members.forEach(member => {
            const name = member.person.full_name.trim();
            const role = member.responsibility.name;
            console.log(`  - ${name} (${role})`);
        });

        const hymnsList = sched.schedule_lists.find(list => list.title === 'Hinos');
        if (hymnsList && hymnsList.schedule_list_items) {
            console.log("\nHinos:");
            hymnsList.schedule_list_items.forEach(hino => {
                console.log(`  - ${hino.content}`);
            });
        }
        console.log("\n");
    });
}

program
    .version('1.0.0')
    .description('CLI para consultar escala de equipe (Node.js)')
    .requiredOption('-t, --token <token>', 'Token da área agendada')
    .option('-c, --count <number>', 'Quantidade de resultados', 2)
    .option('-j, --json', 'Retornar em formato JSON')
    .option('--previousDay <day>', 'Filtrar a partir do dia anterior da semana (ex: DOM → último domingo)')
    .option('--nextDay <day>', 'Filtrar a partir do próximo dia da semana (ex: DOM)')
    .action(async (options) => {
        try {
            const data = await fetchSchedule(options.token);
            const count = parseInt(options.count);
            let fromDate = null;
            if (options.previousDay) {
                fromDate = getPreviousDayDate(options.previousDay);
                if (!fromDate) {
                    console.error(`Dia inválido para --previousDay: ${options.previousDay}. Use: DOM, SEG, TER, QUA, QUI, SEX, SAB`);
                    process.exit(1);
                }
            } else if (options.nextDay) {
                fromDate = getNextDayDate(options.nextDay);
                if (!fromDate) {
                    console.error(`Dia inválido para --nextDay: ${options.nextDay}. Use: DOM, SEG, TER, QUA, QUI, SEX, SAB`);
                    process.exit(1);
                }
            }
            const schedules = processSchedules(data, count, fromDate);

            if (options.json) {
                console.log(JSON.stringify(schedules, null, 2));
            } else {
                printText(schedules);
            }
        } catch (error) {
            console.error(`Erro: ${error.message}`);
        }
    });

program.parse(process.argv);
