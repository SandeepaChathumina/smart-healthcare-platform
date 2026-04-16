kubectl delete -f frontend-service.yaml --ignore-not-found
kubectl delete -f frontend-deployment.yaml --ignore-not-found

kubectl delete -f notification-service.yaml --ignore-not-found
kubectl delete -f notification-deployment.yaml --ignore-not-found

kubectl delete -f appointment-service.yaml --ignore-not-found
kubectl delete -f appointment-deployment.yaml --ignore-not-found

kubectl delete -f doctor-service.yaml --ignore-not-found
kubectl delete -f doctor-deployment.yaml --ignore-not-found

kubectl delete -f patient-service.yaml --ignore-not-found
kubectl delete -f patient-deployment.yaml --ignore-not-found

kubectl delete -f auth-service.yaml --ignore-not-found
kubectl delete -f auth-deployment.yaml --ignore-not-found

kubectl delete secret auth-service-secret --ignore-not-found
kubectl delete secret patient-service-secret --ignore-not-found
kubectl delete secret doctor-service-secret --ignore-not-found
kubectl delete secret appointment-service-secret --ignore-not-found
kubectl delete secret notification-service-secret --ignore-not-found
kubectl delete secret frontend-secret --ignore-not-found

kubectl get pods
kubectl get services
kubectl get secrets