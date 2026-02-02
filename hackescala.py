import requests
import argparse
import json
from datetime import datetime, timezone
from babel.dates import format_datetime

def fetch_schedule(token, limit=50):
    url = f"https://momemtum-back-sigma.vercel.app/api/scheduled-areas/{token}/schedules/optimized?page=1&limit={limit}"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def format_date(dt_str):
    dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    # Localize to PT-BR for day of week
    return format_datetime(dt, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", locale='pt_BR').capitalize()

def process_schedules(data, count=2):
    now = datetime.now(timezone.utc)
    future_schedules = []
    
    # Filter and sort
    schedules = data.get('data', [])
    # Sort by start_datetime just in case
    schedules.sort(key=lambda x: x['start_datetime'])
    
    for item in schedules:
        dt = datetime.fromisoformat(item['start_datetime'].replace('Z', '+00:00'))
        if dt >= now:
            future_schedules.append(item)
            if len(future_schedules) == count:
                break
                
    return future_schedules

def print_text(schedules):
    if not schedules:
        print("Nenhuma escala futura encontrada.")
        return

    for i, sched in enumerate(schedules):
        print(f"--- Escala {i+1} ---")
        print(f"Data: {format_date(sched['start_datetime'])}")
        
        print("\nEquipe:")
        for member in sched.get('schedule_members', []):
            name = member['person']['full_name'].strip()
            role = member['responsibility']['name']
            print(f"  - {name} ({role})")
            
        print("\nHinos:")
        for list_item in sched.get('schedule_lists', []):
            if list_item['title'] == 'Hinos':
                for hino in list_item.get('schedule_list_items', []):
                    print(f"  - {hino['content']}")
        print("\n")

def main():
    parser = argparse.ArgumentParser(description='CLI para consultar escala de equipe.')
    parser.add_argument('--token', type=str, required=True, help='Token da área agendada')
    parser.add_argument('--count', type=int, default=2, help='Quantidade de resultados (padrão: 2)')
    parser.add_argument('--json', action='store_true', help='Retornar em formato JSON')
    
    args = parser.parse_args()
    
    try:
        data = fetch_schedule(args.token)
        schedules = process_schedules(data, args.count)
        
        if args.json:
            print(json.dumps(schedules, indent=2, ensure_ascii=False))
        else:
            print_text(schedules)
            
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    main()
