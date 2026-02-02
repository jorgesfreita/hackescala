#!/usr/bin/env node

const axios = require('axios');
const { program } = require('commander');
const { format, parseISO, isAfter, isToday } = require('date-fns');
const { ptBR } = require('date-fns/locale');

async function fetchSchedule(token) {
    const url = `https://momemtum-back-sigma.vercel.app/api/scheduled-areas/${token}/schedules/optimized?page=1&limit=50`;
    const response = await axios.get(url);
    return response.data;
}

function processSchedules(data, count = 2) {
    const now = new Date();
    
    // Filtra para datas futuras ou hoje
    let schedules = data.data
        .map(item => ({
            ...item,
            startDate: parseISO(item.start_datetime)
        }))
        .filter(item => isAfter(item.startDate, now) || isToday(item.startDate))
        .sort((a, b) => a.startDate - b.startDate);

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
    .action(async (options) => {
        try {
            const data = await fetchSchedule(options.token);
            const count = parseInt(options.count);
            const schedules = processSchedules(data, count);

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
