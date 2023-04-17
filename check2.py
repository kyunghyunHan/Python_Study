even_count = 0
odd_count = 0

for i in range(10):
    num = int(input("숫자를 입력하세요: "))
    if num % 2 == 0:
        even_count += 1
    else:
        odd_count += 1

print("짝수의 개수:", even_count)
print("홀수의 개수:", odd_count)
#이 코드는 even_count와 odd_count 변수를 초기화합니다. 그리고 for 루프를 사용하여 10개의 숫자를 입력받고, 입력된 숫자가 짝수인 경우 even_count를 증가시키고, 홀수인 경우 odd_count를 증가시킵니다. 마지막으로, even_count와 odd_count를 출력합니다.