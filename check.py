
#a,b의 변수 초기화
#짝수
a=0;
#홀수
b=0;
#for문 1부터 10까지 10번 돌리기
for i in range(1,11):
    #10번 돌리면서 input받아서 int형으로 변환후 %2하여 짝수인지 아닌지 판단
    if  int(input())%2==0:
        #짝수면 a 카운터 증가
        a+=1;
    else :
        # 홀수면 b카운터 증가
        b+=1
    
# 짝수의 개수 홀수의갯수 출력
print("짝수의 개수:",a, "홀수의 개수:",b)


#알고리즘 서술

